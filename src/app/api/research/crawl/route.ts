import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const CRAWL_PROMPT = `You are a business intelligence researcher. I'm going to give you the HTML content of a business website. Extract ALL useful information about this business and return it as a JSON object with these fields (use null for anything you can't find):

{
  "business_name": "string",
  "tagline": "string or null",
  "description": "string - 2-3 sentence summary of what this business does",
  "services": ["array of services offered"],
  "service_areas": ["cities, states, or regions served"],
  "team_members": [{"name": "string", "role": "string"}],
  "about": "string - about page content summarized",
  "contact": {
    "phone": "string or null",
    "email": "string or null",
    "address": "string or null"
  },
  "hours": "string or null - business hours if listed",
  "pricing": "string or null - any visible pricing info summarized",
  "reviews_rating": "string or null - any review score mentioned",
  "social_media": {"platform": "url"},
  "unique_selling_points": ["what makes them stand out"],
  "certifications": ["any licenses, certifications, or awards"],
  "year_established": "string or null",
  "key_pages_found": ["list of main pages/sections on the site"]
}

Return ONLY valid JSON, no markdown or explanation.`;

async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MouseBot/1.0; +https://mouse.is)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) return '';
    const html = await res.text();
    // Strip scripts, styles, and tags to get text content
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000); // Cap at 50k chars for API
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverPages(baseUrl: string, html: string): Promise<string[]> {
  // Extract internal links from the homepage HTML
  const urlObj = new URL(baseUrl);
  const linkRegex = /href=["']([^"']+)["']/gi;
  const found = new Set<string>();
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === urlObj.hostname) {
        const path = resolved.pathname.toLowerCase();
        // Target high-value pages
        if (
          path.includes('about') ||
          path.includes('service') ||
          path.includes('team') ||
          path.includes('contact') ||
          path.includes('pricing') ||
          path.includes('price') ||
          path.includes('area') ||
          path.includes('review') ||
          path.includes('testimonial')
        ) {
          found.add(resolved.origin + resolved.pathname);
        }
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return Array.from(found).slice(0, 5); // Max 5 subpages
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Fetch homepage
    const homepageHtml = await fetchPageContent(normalizedUrl);
    if (!homepageHtml) {
      return NextResponse.json({
        success: true,
        data: { business_intel: null, message: 'Could not fetch website' },
      });
    }

    // Fetch the raw HTML for link discovery
    let rawHtml = '';
    try {
      const rawRes = await fetch(normalizedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MouseBot/1.0)' },
      });
      rawHtml = await rawRes.text();
    } catch {
      // Use stripped content only
    }

    // Discover and fetch key subpages
    const subpageUrls = await discoverPages(normalizedUrl, rawHtml);
    const subpageContents = await Promise.allSettled(
      subpageUrls.map(async (pageUrl) => {
        const content = await fetchPageContent(pageUrl);
        return `\n--- PAGE: ${pageUrl} ---\n${content}`;
      })
    );

    const allContent = [
      `--- HOMEPAGE: ${normalizedUrl} ---`,
      homepageHtml,
      ...subpageContents
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value),
    ].join('\n').slice(0, 80000); // Cap total at 80k chars

    // Send to Anthropic for analysis
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${CRAWL_PROMPT}\n\nWebsite content:\n${allContent}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      console.error('Anthropic API error:', await anthropicRes.text());
      return NextResponse.json({
        success: true,
        data: { business_intel: null, message: 'Research API error' },
      });
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || '';

    // Parse the JSON response
    let businessIntel: Record<string, unknown> | null = null;
    try {
      // Handle potential markdown wrapping
      const jsonStr = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      businessIntel = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse business intel JSON:', rawText.slice(0, 200));
    }

    // Store in profiles
    if (businessIntel) {
      await supabase
        .from('profiles')
        .update({
          business_intel: businessIntel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      data: { business_intel: businessIntel },
    });
  } catch (err) {
    console.error('Research crawl error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

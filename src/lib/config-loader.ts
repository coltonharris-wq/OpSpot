import { VerticalConfig } from './types';
import fs from 'fs';
import path from 'path';

const configCache = new Map<string, VerticalConfig>();

export function getVerticalConfig(nicheId: string): VerticalConfig | null {
  if (configCache.has(nicheId)) {
    return configCache.get(nicheId)!;
  }

  // Search through all industry directories
  const configDir = path.join(process.cwd(), 'config', 'verticals');

  try {
    const industries = fs.readdirSync(configDir);
    for (const industry of industries) {
      const industryPath = path.join(configDir, industry);
      if (!fs.statSync(industryPath).isDirectory()) continue;

      const configFile = path.join(industryPath, `${nicheId}.json`);
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        configCache.set(nicheId, config);
        return config;
      }
    }
  } catch {
    // Config directory may not exist yet
  }

  return null;
}

export function getAllVerticalConfigs(): VerticalConfig[] {
  const configDir = path.join(process.cwd(), 'config', 'verticals');
  const configs: VerticalConfig[] = [];

  try {
    const industries = fs.readdirSync(configDir);
    for (const industry of industries) {
      const industryPath = path.join(configDir, industry);
      if (!fs.statSync(industryPath).isDirectory()) continue;

      const files = fs.readdirSync(industryPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const config = JSON.parse(fs.readFileSync(path.join(industryPath, file), 'utf-8'));
        configs.push(config);
      }
    }
  } catch {
    // Config directory may not exist yet
  }

  return configs;
}

export function getVerticalConfigsByIndustry(industrySlug: string): VerticalConfig[] {
  const configDir = path.join(process.cwd(), 'config', 'verticals', industrySlug);
  const configs: VerticalConfig[] = [];

  try {
    const files = fs.readdirSync(configDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const config = JSON.parse(fs.readFileSync(path.join(configDir, file), 'utf-8'));
      configs.push(config);
    }
  } catch {
    // Directory may not exist
  }

  return configs;
}

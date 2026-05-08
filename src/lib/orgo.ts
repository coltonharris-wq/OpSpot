// Orgo.ai VM provisioning client

const ORGO_API_KEY = process.env.ORGO_API_KEY!;
const ORGO_BASE_URL = process.env.ORGO_BASE_URL || 'https://www.orgo.ai/api';
const ORGO_WORKSPACE_ID = process.env.ORGO_WORKSPACE_ID!;

interface CreateVMResponse {
  id: string;
  status: string;
  ip_address?: string;
}

interface VMStatusResponse {
  id: string;
  status: string;
  ip_address?: string;
  error?: string;
}

export async function createVM(configPayload: Record<string, unknown>): Promise<CreateVMResponse> {
  const configB64 = Buffer.from(JSON.stringify(configPayload)).toString('base64');

  const res = await fetch(`${ORGO_BASE_URL}/computers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspace_id: ORGO_WORKSPACE_ID,
      name: `mouse-vm-${Date.now()}`,
      image: 'ubuntu-22.04',
      specs: {
        ram: 4096,
        vcpu: 2,
        disk: 20,
      },
      startup_script: `#!/bin/bash\ncurl -sSL https://mouse.is/install.sh | bash -s -- ${configB64}`,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Orgo API error: ${res.status} ${error}`);
  }

  return res.json();
}

export async function getVMStatus(vmId: string): Promise<VMStatusResponse> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}`, {
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Orgo API error: ${res.status}`);
  }

  return res.json();
}

export async function executeOnVM(vmId: string, command: string): Promise<string> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}/exec`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command }),
  });

  if (!res.ok) {
    throw new Error(`Orgo exec error: ${res.status}`);
  }

  const data = await res.json();
  return data.output || '';
}

/** Extract bare IP from Orgo URL like "http://67.213.119.157:29629" */
export function extractVmIp(ipOrUrl: string): string {
  try {
    const url = new URL(ipOrUrl.startsWith('http') ? ipOrUrl : `http://${ipOrUrl}`);
    return url.hostname;
  } catch {
    return ipOrUrl.replace(/^https?:\/\//, '').split(':')[0];
  }
}

export async function checkVMHealth(ipAddress: string, port: number = 18789): Promise<boolean> {
  try {
    const bareIp = extractVmIp(ipAddress);
    const res = await fetch(`http://${bareIp}:${port}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Manus-style VM interaction helpers ─────────────────────────────

/** Take a screenshot of the VM via Orgo API */
export async function takeScreenshot(vmId: string): Promise<{ url?: string; screenshot_base64?: string }> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}/screenshot`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Orgo screenshot error: ${res.status}`);
  }

  return res.json();
}

/** Click at coordinates on VM screen */
export async function clickOnVM(vmId: string, x: number, y: number, double: boolean = false): Promise<void> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}/click`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ x, y, double }),
  });

  if (!res.ok) {
    throw new Error(`Orgo click error: ${res.status}`);
  }
}

/** Type text on VM */
export async function typeOnVM(vmId: string, text: string): Promise<void> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}/type`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Orgo type error: ${res.status}`);
  }
}

/** Press a key on VM */
export async function pressKeyOnVM(vmId: string, key: string): Promise<void> {
  const res = await fetch(`${ORGO_BASE_URL}/computers/${vmId}/key`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ORGO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) {
    throw new Error(`Orgo key error: ${res.status}`);
  }
}

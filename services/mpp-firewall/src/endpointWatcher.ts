import { trackRequest, removeEndpointRecord } from './endpointTracker.js';

const watched = new Set<string>();

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0.0.0.0') return true;

  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  return false;
}

export function parseAndValidateWatchUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'URL is empty' };

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http(s) URLs are allowed' };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, error: 'Private or local URLs are not allowed' };
  }

  return { ok: true, url: parsed.toString() };
}

export function addWatchedUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const parsed = parseAndValidateWatchUrl(raw);
  if (!parsed.ok) return parsed;
  watched.add(parsed.url);
  return { ok: true, url: parsed.url };
}

export function removeWatchedUrl(raw: string): void {
  const parsed = parseAndValidateWatchUrl(raw);
  if (!parsed.ok) return;
  watched.delete(parsed.url);
  removeEndpointRecord('GET', parsed.url);
}

export function getWatchedUrls(): string[] {
  return [...watched];
}

/** One GET probe; used by the interval loop and right after registering a URL. */
export async function probeUrlOnce(url: string): Promise<void> {
  await probeOneInternal(url);
}

async function probeOneInternal(url: string): Promise<void> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Tempo-Firewall-EndpointWatch/1.0',
        accept: '*/*',
      },
    });
    const latency = Date.now() - t0;
    trackRequest('GET', url, latency, res.status, 'watch');
  } catch {
    const latency = Date.now() - t0;
    trackRequest('GET', url, latency, 503, 'watch');
  } finally {
    clearTimeout(timeout);
  }
}

export function startEndpointWatchProbe(): ReturnType<typeof setInterval> {
  const tick = async () => {
    const urls = [...watched];
    await Promise.all(urls.map((u) => probeOneInternal(u)));
  };
  void tick();
  return setInterval(() => {
    void tick();
  }, 4000);
}

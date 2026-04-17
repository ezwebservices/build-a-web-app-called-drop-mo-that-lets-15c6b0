import type { LambdaFunctionURLHandler } from 'aws-lambda';

const BOT_UA_REGEX =
  /facebookexternalhit|Twitterbot|Slackbot|Discordbot|WhatsApp|LinkedInBot|TelegramBot|Mastodon|iMessage|Facebot|SkypeUriPreview|Applebot|Pinterest|redditbot|Googlebot|bingbot|embedly|vkShare/i;

type Drop = {
  id: string;
  recipientFirstName: string;
  story: string;
  goalAmountCents: number | null;
  dropAtIso: string;
  timezone: string | null;
  status: string | null;
  publicToken: string;
};

type Pledge = { amountCents: number };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= n) return trimmed;
  return trimmed.slice(0, n - 1).trimEnd() + '…';
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const endpoint = (process.env.GRAPHQL_ENDPOINT ?? '').trim();
  const apiKey = (process.env.API_KEY ?? '').trim();
  if (!endpoint || !apiKey) {
    throw new Error('GRAPHQL_ENDPOINT or API_KEY not configured on public-share Lambda');
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  if (!json.data) throw new Error('No data from GraphQL');
  return json.data;
}

async function fetchDropByToken(token: string): Promise<Drop | null> {
  const query = `query GetDropByToken($token: String!) {
    listDrops(filter: { publicToken: { eq: $token } }, limit: 1) {
      items { id recipientFirstName story goalAmountCents dropAtIso timezone status publicToken }
    }
  }`;
  const data = await graphql<{ listDrops: { items: Drop[] } }>(query, { token });
  return data.listDrops.items[0] ?? null;
}

async function fetchPledges(dropId: string): Promise<Pledge[]> {
  const query = `query ListPledges($dropId: ID!) {
    listPledges(filter: { dropId: { eq: $dropId } }, limit: 1000) {
      items { amountCents }
    }
  }`;
  const data = await graphql<{ listPledges: { items: Pledge[] } }>(query, { dropId });
  return data.listPledges.items;
}

function formatDropDate(iso: string, tz: string | null): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz ?? undefined,
      timeZoneName: 'short',
    });
  } catch {
    return new Date(iso).toUTCString();
  }
}

function renderOgSvg(drop: Drop, raisedCents: number, contributorCount: number): string {
  const goalCents = drop.goalAmountCents ?? 0;
  const pct = goalCents > 0 ? Math.max(0, Math.min(100, (raisedCents / goalCents) * 100)) : 0;
  const fillWidth = Math.max(0, Math.min(1072, (1072 * pct) / 100));
  const raised = `$${(raisedCents / 100).toFixed(0)}`;
  const goal = goalCents ? `of $${(goalCents / 100).toFixed(0)}` : 'pledged so far';
  const dropDate = formatDropDate(drop.dropAtIso, drop.timezone);
  const people = `${contributorCount} ${contributorCount === 1 ? 'person' : 'people'} in on the surprise`;
  const headline = `Help surprise ${escapeXml(drop.recipientFirstName)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0c10"/><stop offset="1" stop-color="#2a1a14"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#ed2f09"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="64" y="120" font-family="Georgia, serif" font-size="54" fill="#ff6a3d" font-weight="700">Drop</text>
  <text x="64" y="230" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${headline}</text>
  <text x="64" y="320" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">${escapeXml(raised)} ${escapeXml(goal)}</text>
  <rect x="64" y="360" width="1072" height="24" rx="12" fill="#2a2e3b"/>
  <rect x="64" y="360" width="${fillWidth}" height="24" rx="12" fill="url(#acc)"/>
  <text x="64" y="450" font-family="Arial, sans-serif" font-size="32" fill="#c7cbd6">${escapeXml(people)}</text>
  <text x="64" y="500" font-family="Arial, sans-serif" font-size="28" fill="#9096a8">Drop day · ${escapeXml(dropDate)}</text>
  <text x="64" y="570" font-family="Arial, sans-serif" font-size="22" fill="#6b7186">Rally the group. Surprise the one.</text>
</svg>`;
}

function renderShareHtml(
  drop: Drop,
  appBase: string,
  functionBase: string,
  redirect: boolean,
): string {
  const title = `Help surprise ${drop.recipientFirstName}`;
  const description = truncate(drop.story || 'Join the drop — rally the group, surprise the one.', 160);
  const ogImage = `${functionBase}/og/${drop.publicToken}.png`;
  const canonical = `${appBase}/d/${drop.publicToken}/`;
  const redirectMeta = redirect
    ? `<meta http-equiv="refresh" content="0; url=${escapeHtml(canonical)}">`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta property="og:site_name" content="Drop" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(ogImage)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
${redirectMeta}
<style>body{margin:0;background:#0b0c10;color:#e9ebf1;font-family:Inter,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center;}a{color:#ff6a3d;}h1{font-family:Georgia,serif;font-size:42px;margin:0 0 8px;}p{color:#c7cbd6;max-width:480px;}</style>
</head>
<body>
<div>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${escapeHtml(canonical)}">Open the drop →</a></p>
</div>
</body>
</html>`;
}

function parsePath(rawPath: string): { kind: 'share' | 'og' | null; token: string } {
  const path = rawPath.replace(/\/+$/, '');
  let m = path.match(/^\/s\/([A-Za-z0-9_-]+)$/);
  if (m) return { kind: 'share', token: m[1] };
  m = path.match(/^\/og\/([A-Za-z0-9_-]+)\.(png|svg)$/);
  if (m) return { kind: 'og', token: m[1] };
  return { kind: null, token: '' };
}

export const handler: LambdaFunctionURLHandler = async (event) => {
  const rawPath = event.rawPath || '/';
  const { kind, token } = parsePath(rawPath);
  const ua = (event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '') as string;
  const appBase = (process.env.APP_BASE_URL ?? '').trim().replace(/\/+$/, '') ||
    `https://${event.headers?.host ?? 'localhost'}`;
  const reqHost = event.requestContext?.domainName ?? event.headers?.host ?? '';
  const functionBase = reqHost ? `https://${reqHost}` : '';

  try {
    if (!kind) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: 'Not found',
      };
    }

    const drop = await fetchDropByToken(token);
    if (!drop) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: 'Drop not found',
      };
    }

    if (kind === 'og') {
      const pledges = await fetchPledges(drop.id);
      const raised = pledges.reduce((s, p) => s + (p.amountCents ?? 0), 0);
      const svg = renderOgSvg(drop, raised, pledges.length);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
        body: svg,
      };
    }

    const isBot = BOT_UA_REGEX.test(ua);
    const html = renderShareHtml(drop, appBase, functionBase, !isBot);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
      body: html,
    };
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    console.error(`public-share error: ${msg}`);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: `Internal error: ${msg}`,
    };
  }
};

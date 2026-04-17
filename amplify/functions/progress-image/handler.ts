import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

type Metrics = {
  recipient: string;
  raisedCents: number;
  goalCents: number;
  contributorCount: number;
  dropAtIso: string;
};

function renderSvg(m: Metrics): string {
  const raisedCents = Number.isFinite(m.raisedCents) ? Math.max(0, m.raisedCents) : 0;
  const goalCents = Number.isFinite(m.goalCents) ? Math.max(0, m.goalCents) : 0;
  const rawPct = goalCents > 0 ? (raisedCents / goalCents) * 100 : 0;
  const pct = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, rawPct)) : 0;
  const fillWidth = Math.max(0, Math.min(1072, (1072 * pct) / 100));
  const raised = `$${(raisedCents / 100).toFixed(0)}`;
  const goal = goalCents ? `of $${(goalCents / 100).toFixed(0)}` : 'pledged';
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
  <text x="64" y="120" font-family="Georgia" font-size="54" fill="#ff6a3d">Drop</text>
  <text x="64" y="220" font-family="Arial" font-size="48" font-weight="700" fill="#fff">For ${m.recipient}</text>
  <text x="64" y="290" font-family="Arial" font-size="80" font-weight="800" fill="#fff">${raised} ${goal}</text>
  <rect x="64" y="340" width="1072" height="24" rx="12" fill="#2a2e3b"/>
  <rect x="64" y="340" width="${fillWidth}" height="24" rx="12" fill="url(#acc)"/>
  <text x="64" y="430" font-family="Arial" font-size="32" fill="#c7cbd6">${m.contributorCount} people in on the surprise</text>
  <text x="64" y="480" font-family="Arial" font-size="28" fill="#9096a8">Drop day · ${new Date(m.dropAtIso).toLocaleString()}</text>
</svg>`;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const qs = event.queryStringParameters ?? {};
  const metrics: Metrics = {
    recipient: qs.recipient ?? 'a friend',
    raisedCents: parseInt(qs.raised ?? '0', 10),
    goalCents: parseInt(qs.goal ?? '0', 10),
    contributorCount: parseInt(qs.count ?? '0', 10),
    dropAtIso: qs.dropAt ?? new Date().toISOString(),
  };
  const svg = renderSvg(metrics);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
    body: svg,
  };
};

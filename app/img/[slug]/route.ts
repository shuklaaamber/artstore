import crypto from "node:crypto";

// Generated placeholder artwork (no external image hosting needed). Deterministic per slug:
// the hash picks a palette and one of three motifs (landscape, abstract circles, waves).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const h = crypto.createHash("md5").update(slug).digest();
  const hue = Math.round((h[0] / 255) * 360);
  const motif = h[1] % 3;
  const c = (dh: number, s: number, l: number, a = 1) => `hsl(${(hue + dh) % 360} ${s}% ${l}% / ${a})`;
  const r = (i: number, min: number, max: number) => min + (h[i % 16] / 255) * (max - min);

  let art = "";
  if (motif === 0) {
    art = `<circle cx="${r(2, 130, 270)}" cy="${r(3, 150, 210)}" r="${r(4, 38, 60)}" fill="${c(30, 80, 78)}"/>
<path d="M0 340 Q100 ${r(5, 240, 290)} 210 330 T400 300 V500 H0Z" fill="${c(200, 30, 38)}"/>
<path d="M0 400 Q130 ${r(6, 320, 360)} 250 395 T400 370 V500 H0Z" fill="${c(160, 35, 28)}"/>`;
  } else if (motif === 1) {
    for (let i = 0; i < 6; i++) {
      art += `<circle cx="${r(i + 2, 60, 340)}" cy="${r(i + 8, 80, 400)}" r="${r(i + 4, 40, 120)}" fill="${c(i * 35, 55, 55 + i * 4, 0.55)}"/>`;
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const y = 170 + i * 52;
      art += `<path d="M0 ${y} Q60 ${y - r(i + 2, 20, 45)} 120 ${y} T240 ${y} T400 ${y} V500 H0Z" fill="${c(i * 18, 50, 70 - i * 8, 0.9)}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="Artwork preview">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c(0, 45, 88)}"/><stop offset="1" stop-color="${c(25, 40, 74)}"/></linearGradient></defs>
<rect width="400" height="500" fill="url(#g)"/>
${art}
<rect x="10" y="10" width="380" height="480" fill="none" stroke="${c(0, 30, 22)}" stroke-width="20"/>
<rect x="20" y="20" width="360" height="460" fill="none" stroke="${c(0, 30, 90, 0.5)}" stroke-width="2"/>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=31536000, immutable" } });
}

const sharp = require("sharp");

/* ════════════════════════════════════════════════════════════
   Shared background keyer for logo sources.

   Every logo we've been handed so far is a flat export with the mark
   sitting on a solid plate — white for the hero-nav crests, black for
   the Freeing India lockup — and no alpha channel. Dropping those
   straight onto the near-black page reads as a stray rectangle, so the
   plate has to be keyed out.

   Two knobs cover every case we've hit:

   `key`   which plate colour to remove. "light" scores a pixel by
           min(r,g,b) and treats HIGH values as background; "dark"
           scores by max(r,g,b) and treats LOW values as background.
           Either way the score is deliberately the channel extreme
           that a *coloured* pixel can't reach, so saturated artwork
           (the Aimore blue, the Freeing yellow) never registers as
           plate no matter how light or dark it is overall.

   `flood` true floods inward from the four edges, so only plate
           actually connected to the border is removed and any
           enclosed plate-coloured region inside the artwork survives
           (highlights inside the LICET crest). false keys globally,
           which is what line art wants — the black channels inside
           the Freeing India maze are negative space and should let
           the page through like the rest of the plate.

   Pixels in the SOFT_BAND either side of the threshold get a partial
   alpha rather than a binary in/out, so the anti-aliased rim (and, on
   a JPEG source, its compression ringing) fades instead of stair-
   stepping.
   ════════════════════════════════════════════════════════════ */

/** @returns 0 for "definitely artwork" … 1 for "definitely background" */
function backgroundness(score, key, threshold, softBand) {
  const t =
    key === "light"
      ? (score - (threshold - softBand)) / softBand
      : (threshold + softBand - score) / softBand;
  return Math.max(0, Math.min(1, t));
}

async function keyOutBackground(
  src,
  { key = "light", threshold = 235, softBand = 40, flood = true } = {}
) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const score =
    key === "light"
      ? (i) => Math.min(data[i], data[i + 1], data[i + 2])
      : (i) => Math.max(data[i], data[i + 1], data[i + 2]);

  // Which pixels are eligible to be keyed. In flood mode that's only the
  // ones reachable from a border pixel without crossing artwork; otherwise
  // it's the whole image and the mask is skipped entirely.
  let keyable = null;
  if (flood) {
    keyable = new Uint8Array(width * height);
    const stack = [];
    for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
    for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);

    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const p = y * width + x;
      if (keyable[p]) continue;
      if (backgroundness(score(p * channels), key, threshold, softBand) <= 0) {
        continue; // artwork — the flood stops here
      }
      keyable[p] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  for (let p = 0; p < width * height; p++) {
    if (keyable && !keyable[p]) continue;
    const i = p * channels;
    const b = backgroundness(score(i), key, threshold, softBand);
    if (b <= 0) continue;
    // A partially-keyed pixel keeps its own colour, which on a light plate
    // is a pale fringe and on a dark one a murky one. Compositing it toward
    // the artwork side instead would need to know the mark's colour; at
    // these alphas the fringe is a sub-pixel rim, so it's left alone.
    data[i + 3] = Math.round(data[i + 3] * (1 - b));
  }

  return sharp(data, { raw: { width, height, channels } });
}

module.exports = { keyOutBackground };

const path = require("path");
const sharp = require("sharp");
const { keyOutBackground } = require("./key-background");

/* ════════════════════════════════════════════════════════════
   Prepare the sponsor marks for the #sponsors section.

   The two sources arrived in very different shapes:

   · Aimore (PNG, 2154x776) already carries alpha and a transparent
     surround, so there is nothing to key — but it ships ~800 kB of
     mostly-empty pixels at a size nothing on the page renders at.

   · Freeing India (JPEG, 4961x3508, 5.3 MB) is flat yellow line art on
     a solid BLACK plate — the opposite of the hero crests. Keyed
     globally rather than flooded from the edges: the black channels
     inside the exclamation-mark maze are negative space, part of the
     same plate as the surround, and leaving them opaque would print
     black slabs through the middle of the mark once it sits on the
     section's navy.

   · Tech Panda (JPEG, 1080x1350) is a dark wordmark on a WHITE plate,
     with most of that square being empty margin. Keyed globally for the
     same reason as Freeing India, but for the counters rather than a
     maze: flooding from the edges would stop at the letter strokes and
     leave a white pip inside every e, a, d, o and p — visible as soon
     as the mark sits on a plate that is off-white rather than pure.

   Both are then trimmed to the ink and resized: whatever padding the
   source happened to carry would otherwise become invisible dead space
   inside the card, and two logos padded differently do not optically
   align no matter what the CSS says.

   Re-run after replacing either source: node tools/make-sponsor-logos.js
   ════════════════════════════════════════════════════════════ */

const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "../images/Sponsor Logos");

const JOBS = [
  {
    src: `${SRC}/logo aimore 2k.png`,
    out: `${ROOT}/images/Sponsors/aimore-transparent.png`,
    // Already transparent — trim and downscale only.
    key: null,
    // Title sponsor: rendered largest, so it keeps the most pixels.
    width: 1200,
  },
  {
    src: `${SRC}/freeing india logo Nungambakkam.jpg.jpeg`,
    out: `${ROOT}/images/Sponsors/freeing-india-transparent.png`,
    // max(r,g,b) <= 60 is plate. The yellow sits at 255 on red/green, so
    // the gap between artwork and plate is the entire range — the only
    // pixels anywhere near the threshold are the JPEG's edge ringing,
    // which the soft band fades out.
    key: { key: "dark", threshold: 60, softBand: 45, flood: false },
    width: 900,
  },
  {
    src: `${SRC}/techpanda.jpeg`,
    out: `${ROOT}/images/Sponsors/techpanda-transparent.png`,
    // min(r,g,b) >= 235 is plate. The darkest ink here is the green "p",
    // whose blue channel still sits around 60 — the whole soft band is
    // clear of the artwork and only catches the JPEG's edge ringing.
    key: { key: "light", threshold: 235, softBand: 40, flood: false },
    // Rendered smaller than the other partner mark is at its widest, so
    // it needs fewer pixels than Freeing India to stay sharp at 2x.
    width: 700,
  },
];

(async () => {
  for (const { src, out, key, width } of JOBS) {
    const keyed = key ? await keyOutBackground(src, key) : sharp(src).ensureAlpha();

    /* Two passes, because sharp's trim works on the buffer it was given
       and the keyer hands back raw pixels rather than an encoded image. */
    const trimmed = await keyed.png().toBuffer();

    const info = await sharp(trimmed)
      // Against the alpha channel: the surround is transparent by now, so
      // "similar to the corner pixel" means "still empty".
      .trim({ threshold: 8 })
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);

    console.log(
      `${out.split(/[\\/]/).pop().padEnd(34)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`
    );
  }
})();

const path = require("path");
const { keyOutBackground } = require("./key-background");

/* ════════════════════════════════════════════════════════════
   Key the white background out of the two hero-nav logos.

   Both source files are flat white-background exports (confirmed via
   metadata: hasAlpha: false, corner pixels ~254-255). A global white
   threshold would also punch holes in any white *inside* the artwork
   (e.g. highlights inside the LICET crest), so this floods inward from
   the four edges instead — only background actually connected to the
   border becomes transparent.

   The keyer itself lives in ./key-background.js, shared with the
   sponsor logos (which key black rather than white).

   Re-run after replacing either source: node tools/make-logo-transparent.js
   ════════════════════════════════════════════════════════════ */

const ROOT = path.resolve(__dirname, "..");
const KEY = { key: "light", threshold: 235, softBand: 40, flood: true };

const JOBS = [
  { src: `${ROOT}/images/Logo/Dept logo.jpeg`, out: `${ROOT}/images/Logo/dept-logo-transparent.png` },
  { src: `${ROOT}/images/Logo/licet logo.png`, out: `${ROOT}/images/Logo/licet-logo-transparent.png` },
];

(async () => {
  for (const { src, out } of JOBS) {
    const result = await keyOutBackground(src, KEY);
    const info = await result.png().toFile(out);
    console.log(
      `${out.split(/[\\/]/).pop().padEnd(28)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`
    );
  }
})();

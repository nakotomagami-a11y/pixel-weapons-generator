// Grid of every blade pommel at real app render sizes (nativeDim 40 & 60).
// `bun scripts/preview-pommels.mjs [out.png]`
import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { IconGenerator } from "../src/generator.ts";

const POMMELS = [
  "round", "gem", "faceted", "wheel", "ring", "trefoil",
  "acorn", "scentstopper", "spike", "flanged", "crown", "birdhead", "none",
];
const DIMS = [40, 60];
const COLS = POMMELS.length;
const out = process.argv[2] ?? "preview-pommels.png";
const pad = 6;
const scale = 4;

const cellFor = (d) => d;
const rowH = Math.max(...DIMS) + pad;
const sheetW = COLS * (Math.max(...DIMS) + pad) + pad;
const sheetH = DIMS.length * rowH + pad;
const sheet = createCanvas(sheetW * scale, sheetH * scale);
const sctx = sheet.getContext("2d");
sctx.imageSmoothingEnabled = false;
sctx.fillStyle = "#20222b";
sctx.fillRect(0, 0, sheetW * scale, sheetH * scale);

DIMS.forEach((dim, row) => {
  POMMELS.forEach((pommel, col) => {
    const tile = createCanvas(dim, dim);
    const tctx = tile.getContext("2d");
    new IconGenerator(tctx, dim, {}).generate({
      seed: `pommel-${pommel}`,
      iconClass: "blades",
      parts: { blades: { profile: "knight", guard: "bar", pommel, twoHanded: false } },
    });
    const x = pad + col * (Math.max(...DIMS) + pad);
    const y = pad + row * rowH;
    sctx.drawImage(tile, x * scale, y * scale, dim * scale, dim * scale);
  });
});

writeFileSync(out, sheet.toBuffer("image/png"));
console.log(`wrote ${out} (${sheetW * scale}x${sheetH * scale})`);
console.log(POMMELS.join(", "));

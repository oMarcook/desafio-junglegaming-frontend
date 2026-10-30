import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
let before = 0,
  after = 0;
for (const file of await readdir("public/assets")) {
  if (!file.endsWith(".png")) continue;
  const source = `public/assets/${file}`;
  const target = source.replace(/\.png$/, ".webp");
  await sharp(source)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(target);
  before += (await stat(source)).size;
  after += (await stat(target)).size;
}
console.log(
  JSON.stringify({
    originalBytes: before,
    webpBytes: after,
    reduction: `${(100 - (after / before) * 100).toFixed(1)}%`,
  }),
);

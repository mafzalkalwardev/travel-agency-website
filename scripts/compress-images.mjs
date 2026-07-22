import sharp from "sharp";
import fs from "fs";
import path from "path";

const targets = [
  "public/assets/destinations/ksa-jeddah.jpg",
  "public/assets/destinations/umrah-makkah.jpg",
  "public/assets/destinations/oman-muscat.jpg",
  "public/assets/destinations/uae-dubai.jpg",
  "public/assets/destinations/bahrain.jpg",
  "public/assets/destinations/afghanistan.jpg",
  "public/assets/destinations/dubai-tours.jpg",
  "public/assets/destinations/corporate-travel.jpg",
  "public/assets/destinations/malaysia-kl.jpg",
  "public/assets/destinations/thailand.jpg",
  "public/assets/destinations/turkey-istanbul.jpg",
  "public/assets/heroes/hero-poster.jpg",
  "public/assets/heroes/tickets.jpg",
  "public/assets/heroes/destinations.jpg",
  "public/assets/heroes/umrah.jpg",
  "public/assets/heroes/about.jpg",
  "public/assets/heroes/services.jpg",
  "public/assets/heroes/tours.jpg",
  "public/assets/heroes/corporate.jpg",
  "public/assets/heroes/gallery.jpg",
  "public/assets/heroes/blog.jpg",
  "public/assets/heroes/contact.jpg",
  "public/assets/heroes/inquiry.jpg",
];

const MAX_W = 1400;
const QUALITY = 78;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function replaceFile(dest, buf) {
  const tmp = `${dest}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, buf);
  for (let i = 0; i < 10; i++) {
    try {
      fs.renameSync(tmp, dest);
      return "renamed";
    } catch {
      try {
        fs.copyFileSync(tmp, dest);
        fs.unlinkSync(tmp);
        return "copied";
      } catch {
        await sleep(200 * (i + 1));
      }
    }
  }
  const alt = dest.replace(/(\.[^.]+)$/, ".opt$1");
  fs.renameSync(tmp, alt);
  return `alt:${alt}`;
}

let saved = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.log("skip missing", file);
    continue;
  }
  const before = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  let pipeline = sharp(file).rotate();
  if ((meta.width || 0) > MAX_W) {
    pipeline = pipeline.resize({ width: MAX_W, withoutEnlargement: true });
  }
  const out = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
  if (out.length >= before * 0.98 && (meta.width || 0) <= MAX_W) {
    console.log("KEEP", file, `${Math.round(before / 1024)}KB`);
    continue;
  }
  const how = await replaceFile(file, out);
  const after = fs.existsSync(file) ? fs.statSync(file).size : out.length;
  saved += Math.max(0, before - after);
  console.log(
    "OK",
    file,
    `${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`,
    how
  );
}
console.log("TOTAL SAVED", `${Math.round(saved / 1024)}KB`);

import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#08090b"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="#c9d4dc" stroke-width="2"/>
  <path fill="#ece8e1" d="M16 8 L18.3 17 L16 14.8 L13.7 17 Z"/>
</svg>`;

async function raster(size, outPath) {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:#08090b;overflow:hidden}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  writeFileSync(outPath, buf);
  await browser.close();
}

await raster(16, "/workspace/.grok/favicon-16.png");
await raster(180, "/workspace/.grok/icon-180.png.tmp");
await raster(192, "/workspace/.grok/icon-192.png.tmp");
await raster(512, "/workspace/.grok/icon-512.png.tmp");
console.log("rasterized");

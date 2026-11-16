import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.VITE_SITE_URL?.replace(/\/$/, "");
const outputDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const sitemapPath = join(outputDirectory, "sitemap.xml");
const robotsPath = join(outputDirectory, "robots.txt");
await mkdir(dirname(sitemapPath), { recursive: true });
if (!base) {
  await writeFile(robotsPath, "User-agent: *\nDisallow: /\n", "utf8");
  try { await unlink(sitemapPath); } catch { /* No generated sitemap exists yet. */ }
  const htmlPath = join(outputDirectory, "index.html");
  const html = await readFile(htmlPath, "utf8");
  await writeFile(htmlPath, html.replace('name="robots" content="index,follow"', 'name="robots" content="noindex,follow"'), "utf8");
  console.log("VITE_SITE_URL is not set; skipping canonical sitemap generation.");
  process.exit(0);
}

const paths = ["/", "/services", "/backup", "/solar", "/commercial", "/how-it-works", "/projects", "/about", "/faq", "/estimator", "/assessment", "/contact", "/privacy", "/terms"];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${base}${path === "/" ? "/" : path}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(sitemapPath, xml, "utf8");
await writeFile(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, "utf8");
const htmlPath = join(outputDirectory, "index.html");
const html = await readFile(htmlPath, "utf8");
await writeFile(htmlPath, html.replace('name="robots" content="noindex,follow"', 'name="robots" content="index,follow"'), "utf8");
console.log(`Generated sitemap for ${base}.`);

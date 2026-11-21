// After `vite build`: writes dist/work/<slug>/index.html for every project — the same app,
// with that project's title, description and link-preview image (public/og/<slug>.jpg), so a
// single project can be shared. The app opens the project from the address on load.
// Also rewrites dist/sitemap.xml with the project pages.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {projects} from '../src/data/projects.js';

const site = 'https://ardakurucu.com';
const page = readFileSync('dist/index.html', 'utf8');
const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const swap = (html, pattern, value) => {
  if (!pattern.test(html)) throw new Error(`project-pages: ${pattern} not found in dist/index.html`);
  return html.replace(pattern, value);
};

for (const project of projects) {
  const url = `${site}/work/${project.slug}/`;
  const title = escape(`${project.title} — Arda Kurucu`);
  const description = escape(project.summary);
  const image = existsSync(`public/og/${project.slug}.jpg`) ? `${site}/og/${project.slug}.jpg` : `${site}/og-image.jpg`;
  let html = page;
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = swap(html, /(<meta name="description" content=")[^"]*/, `$1${description}`);
  html = swap(html, /(<meta property="og:type" content=")[^"]*/, '$1article');
  html = swap(html, /(<meta property="og:title" content=")[^"]*/, `$1${title}`);
  html = swap(html, /(<meta name="twitter:title" content=")[^"]*/, `$1${title}`);
  html = swap(html, /(<meta property="og:description" content=")[^"]*/, `$1${description}`);
  html = swap(html, /(<meta name="twitter:description" content=")[^"]*/, `$1${description}`);
  html = swap(html, /(<link rel="canonical" href=")[^"]*/, `$1${url}`);
  html = swap(html, /(<meta property="og:url" content=")[^"]*/, `$1${url}`);
  html = swap(html, /(<meta property="og:image" content=")[^"]*/, `$1${image}`);
  html = swap(html, /(<meta name="twitter:image" content=")[^"]*/, `$1${image}`);
  mkdirSync(`dist/work/${project.slug}`, {recursive: true});
  writeFileSync(`dist/work/${project.slug}/index.html`, html);
}

const urls = ['/', '/card/', '/project/', ...projects.map((project) => `/work/${project.slug}/`)];
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${site}${path}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`project-pages: ${projects.length} project pages`);

#!/usr/bin/env node
/**
 * Копирует собранный сайт из репозитория onepagesite в папку prototype/ этой презентации.
 *
 * Сайт собран под корень домена, а GitHub Pages отдаёт проект из подпапки, поэтому
 * абсолютные пути переписываются на /natrium-presentation/prototype/. Счётчик Яндекс
 * Метрики из копии вырезается: просмотры презентации не должны попадать в статистику клуба.
 *
 *   node tools/sync-prototype.mjs ../onepagesite/dist
 */
import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve(process.argv[2] ?? '../onepagesite/dist');
const target = path.resolve('prototype');
const BASE = '/natrium-presentation/prototype/';

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error(`Нет собранного сайта в ${source}: сначала npm run build в onepagesite`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

const rewrite = (text) =>
  text
    .replace(/((?:href|src|srcset|data-[a-z-]+)=")\/(?!\/)/g, `$1${BASE}`)
    .replace(/url\((['"]?)\/(?!\/)/g, `url($1${BASE}`);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

for (const file of walk(target)) {
  if (file.endsWith('.css')) fs.writeFileSync(file, rewrite(fs.readFileSync(file, 'utf8')));
  if (!file.endsWith('.html')) continue;
  let html = rewrite(fs.readFileSync(file, 'utf8'));
  // Счётчик и его отбивка для посетителей без JS.
  html = html.replace(/<script>(?:(?!<\/script>)[\s\S])*mc\.yandex\.ru(?:(?!<\/script>)[\s\S])*<\/script>/g, '');
  html = html.replace(/<noscript>\s*<div>\s*<img[^>]*mc\.yandex\.ru[\s\S]*?<\/noscript>/g, '');
  if (/mc\.yandex\.ru/.test(html)) {
    console.error(`${path.relative(target, file)}: счётчик Метрики не вырезан — копия испортит статистику клуба`);
    process.exit(1);
  }
  fs.writeFileSync(file, html);
}
fs.rmSync(path.join(target, 'robots.txt'), { force: true });
console.log(`prototype/ обновлён из ${source}`);

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const blogDir = new URL('../public/blog/', import.meta.url);
const blogIndexPath = new URL('index.html', blogDir);
const blogCssPath = new URL('blog.css', blogDir);
const blogRuntimePath = new URL('blog.js', blogDir);

test('blog listing uses the new landing visual language', async () => {
  const html = await readFile(blogIndexPath, 'utf8');

  assert.match(html, /<body class="blog-shell">/);
  assert.match(html, /href="\/blog\/blog\.css"/);
  assert.match(html, /Ideas para fundar/);
  assert.match(html, /id="blogListGrid"/);
  assert.match(html, /href="\/#contacto"/);
  assert.doesNotMatch(html, /href="\/styles\.css"/);
});

test('blog listing keeps accessible navigation and social links', async () => {
  const html = await readFile(blogIndexPath, 'utf8');

  assert.match(html, /id="burger"[^>]+aria-expanded="false"/);
  assert.match(html, /id="mnav"[^>]+aria-hidden="true"/);
  assert.match(html, /aria-current="page"[^>]*>Blog<\/a>/);
  assert.match(html, /https:\/\/www\.instagram\.com\/4founderstudio\//);
  assert.match(html, /href="\/legal\/privacidad\.html"/);
});

test('blog runtime remains data-driven and exposes category filters', async () => {
  await access(blogRuntimePath);
  const runtime = await readFile(blogRuntimePath, 'utf8');

  assert.match(runtime, /fetch\('\/blog\/posts\.json'/);
  assert.match(runtime, /aria-pressed/);
  assert.match(runtime, /aria-hidden/);
  assert.match(runtime, /readingMinutes/);
  assert.match(runtime, /formatDate/);
});

test('blog stylesheet protects the responsive layout', async () => {
  await access(blogCssPath);
  const css = await readFile(blogCssPath, 'utf8');

  assert.match(css, /grid-template-columns/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /overflow-x: hidden/);
});

test('blog assets resolve from the public directory', async () => {
  await access(fileURLToPath(blogIndexPath));
  await access(fileURLToPath(blogRuntimePath));
});

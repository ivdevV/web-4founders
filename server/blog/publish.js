import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderArticle } from './template.js';
import { sanitizeBodyHtml, estimateReadingMinutes } from './sanitize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const blogDir = path.join(root, 'public', 'blog');
const postsJsonPath = path.join(blogDir, 'posts.json');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function authSecret(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function readPostsIndex() {
  try {
    const raw = await fs.readFile(postsJsonPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.posts) ? data : { posts: [] };
  } catch (err) {
    if (err.code === 'ENOENT') return { posts: [] };
    throw err;
  }
}

function validatePayload(body) {
  const errors = [];
  const slug = String(body.slug || '').trim();
  const title = String(body.title || '').trim();
  const excerpt = String(body.excerpt || '').trim();
  const category = String(body.category || '').trim();
  const bodyHtml = String(body.bodyHtml || '').trim();

  if (!slug || slug.length < 3 || slug.length > 80 || !SLUG_RE.test(slug)) {
    errors.push('slug inválido (kebab-case, 3–80 caracteres).');
  }
  if (slug.includes('..') || slug.includes('/')) errors.push('slug no puede contener rutas.');
  if (!title || title.length > 200) errors.push('title obligatorio (máx. 200 caracteres).');
  if (!excerpt || excerpt.length > 400) errors.push('excerpt obligatorio (máx. 400 caracteres).');
  if (!category || category.length > 60) errors.push('category obligatorio (máx. 60 caracteres).');
  if (!bodyHtml || bodyHtml.length > 100000) errors.push('bodyHtml obligatorio (máx. 100 KB).');

  const cover = body.cover ? String(body.cover).trim() : '';
  if (cover && cover.length > 500) errors.push('cover demasiado largo.');

  return {
    errors,
    data: {
      slug,
      title,
      excerpt,
      category,
      bodyHtml,
      cover: cover || undefined,
      published: body.published !== false,
      author: String(body.author || '4Founders Studio').trim().slice(0, 80),
      date: body.date ? String(body.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    },
  };
}

async function writeLocalFiles(slug, articleHtml, postsIndex) {
  const articleDir = path.join(blogDir, slug);
  await fs.mkdir(articleDir, { recursive: true });
  await fs.writeFile(path.join(articleDir, 'index.html'), articleHtml, 'utf8');
  await fs.writeFile(postsJsonPath, JSON.stringify(postsIndex, null, 2) + '\n', 'utf8');
}

async function githubRequest(token, repo, method, apiPath, body) {
  const [owner, name] = repo.split('/');
  const url = `https://api.github.com/repos/${owner}/${name}${apiPath}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function getFileSha(token, repo, branch, filePath) {
  try {
    const data = await githubRequest(token, repo, 'GET', `/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`);
    return data.sha;
  } catch (err) {
    if (String(err.message).includes('404')) return null;
    throw err;
  }
}

async function commitToGitHub(token, repo, branch, files, message) {
  const refData = await githubRequest(token, repo, 'GET', `/git/ref/heads/${branch}`);
  const baseCommitSha = refData.object.sha;
  const commitData = await githubRequest(token, repo, 'GET', `/git/commits/${baseCommitSha}`);
  const baseTreeSha = commitData.tree.sha;

  const treeEntries = [];
  for (const file of files) {
    const blob = await githubRequest(token, repo, 'POST', '/git/blobs', {
      content: file.content,
      encoding: 'utf-8',
    });
    treeEntries.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  const tree = await githubRequest(token, repo, 'POST', '/git/trees', {
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const newCommit = await githubRequest(token, repo, 'POST', '/git/commits', {
    message,
    tree: tree.sha,
    parents: [baseCommitSha],
  });

  await githubRequest(token, repo, 'PATCH', `/git/refs/heads/${branch}`, {
    sha: newCommit.sha,
  });
}

export async function publishBlogPost(req, res) {
  const secret = process.env.BLOG_PUBLISH_SECRET;
  if (!secret) {
    console.warn('BLOG_PUBLISH_SECRET not configured — rejecting publish');
    return res.status(503).json({ error: 'Publicación de blog no configurada.' });
  }
  if (authSecret(req) !== secret) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const { errors, data } = validatePayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const postsIndex = await readPostsIndex();
  if (postsIndex.posts.some((p) => p.slug === data.slug)) {
    return res.status(409).json({ error: 'Ya existe un artículo con ese slug.' });
  }

  const sanitizedBody = sanitizeBodyHtml(data.bodyHtml);
  if (!sanitizedBody) {
    return res.status(400).json({ error: 'bodyHtml no contiene contenido válido tras sanitizar.' });
  }

  const readingMinutes = estimateReadingMinutes(sanitizedBody);
  const meta = {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    category: data.category,
    cover: data.cover,
    readingMinutes,
    published: data.published,
  };

  const articleHtml = renderArticle({ ...meta, author: data.author }, sanitizedBody);

  postsIndex.posts = [meta, ...postsIndex.posts].sort((a, b) => b.date.localeCompare(a.date));

  try {
    await writeLocalFiles(data.slug, articleHtml, postsIndex);

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (token && repo) {
      const articlePath = `public/blog/${data.slug}/index.html`;
      const indexPath = 'public/blog/posts.json';
      await commitToGitHub(
        token,
        repo,
        branch,
        [
          { path: articlePath, content: articleHtml },
          { path: indexPath, content: JSON.stringify(postsIndex, null, 2) + '\n' },
        ],
        `content: publicar artículo "${data.title}"`,
      );
    } else {
      console.warn('GITHUB_TOKEN/GITHUB_REPO not configured — article saved locally only');
    }

    return res.json({ ok: true, url: `/blog/${data.slug}/` });
  } catch (err) {
    console.error('Blog publish error:', err.message);
    return res.status(502).json({ error: 'No pudimos publicar el artículo. Inténtalo de nuevo.' });
  }
}

export { readPostsIndex, validatePayload, sanitizeBodyHtml };

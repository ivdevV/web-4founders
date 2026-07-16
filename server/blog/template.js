function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function renderArticle(post, bodyHtml) {
  const {
    slug,
    title,
    excerpt,
    date,
    category,
    cover,
    author = '4Founders Studio',
    readingMinutes,
  } = post;
  const url = `https://www.4founders.studio/blog/${slug}/`;
  const safeTitle = escapeHtml(title);
  const safeExcerpt = escapeHtml(excerpt);
  const safeCategory = escapeHtml(category);
  const safeAuthor = escapeHtml(author);
  const dateLabel = formatDate(date);
  const coverTag = cover
    ? `<img class="article-cover" src="${escapeHtml(cover)}" alt="">`
    : '';
  const readLabel = readingMinutes ? `${readingMinutes} min de lectura` : '';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    datePublished: date,
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: '4Founders Studio' },
    mainEntityOfPage: url,
    ...(cover ? { image: cover.startsWith('http') ? cover : `https://www.4founders.studio${cover}` } : {}),
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} | 4Founders Studio</title>
<meta name="description" content="${safeExcerpt}">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="4Founders Studio">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeExcerpt}">
<meta property="og:url" content="${url}">
${cover ? `<meta property="og:image" content="${escapeHtml(cover.startsWith('http') ? cover : `https://www.4founders.studio${cover}`)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeExcerpt}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%232B2B2B'/%3E%3Ctext x='16' y='21' font-family='Georgia,serif' font-size='13' fill='%23E8D9B0' text-anchor='middle'%3E4F%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${jsonLd}</script>
</head>
<body data-headtype="clasico">

<header class="site-header" id="header">
  <div class="wrap header-inner">
    <a href="/" class="logo" aria-label="4Founders Studio — inicio">
      <span class="logo-mark"><span>4F</span></span>
      <span class="logo-words">
        <span class="lw-name">4Founders</span>
        <span class="lw-studio">Studio</span>
      </span>
    </a>
    <nav class="nav" aria-label="Principal">
      <a href="/#servicios">Servicios</a>
      <a href="/#metodologia">Metodología</a>
      <a href="/blog" class="is-active">Blog</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <div class="header-cta">
      <a href="/#contacto" class="btn">Reserva tu sesión de diagnóstico gratuita <span class="arrow">→</span></a>
      <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>
<nav class="mnav" id="mnav" aria-label="Menú móvil">
  <a href="/#servicios">Servicios</a>
  <a href="/#metodologia">Metodología</a>
  <a href="/blog">Blog</a>
  <a href="/#faq">FAQ</a>
  <a href="/#contacto" class="btn">Reserva tu sesión de diagnóstico gratuita <span class="arrow">→</span></a>
</nav>

<main class="article-page s-blanco pad-sm">
  <article class="wrap article-wrap">
    <nav class="article-breadcrumb" aria-label="Miga de pan">
      <a href="/blog">Blog</a>
      <span aria-hidden="true">/</span>
      <span>${safeTitle}</span>
    </nav>
    <header class="article-header">
      <span class="blog-category">${safeCategory}</span>
      <h1 class="article-title">${safeTitle}</h1>
      <div class="article-meta">
        <time datetime="${escapeHtml(date)}">${dateLabel}</time>
        ${readLabel ? `<span class="article-meta-sep" aria-hidden="true">·</span><span>${readLabel}</span>` : ''}
        <span class="article-meta-sep" aria-hidden="true">·</span>
        <span>${safeAuthor}</span>
      </div>
      ${coverTag}
    </header>
    <div class="article-prose">
      ${bodyHtml}
    </div>
    <footer class="article-cta">
      <p>¿Tienes una idea y no sabes por dónde empezar?</p>
      <a href="/#contacto" class="btn">Reserva tu sesión de diagnóstico gratuita <span class="arrow">→</span></a>
    </footer>
  </article>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="logo" aria-label="4Founders Studio">
          <span class="logo-mark"><span>4F</span></span>
          <span class="logo-words">
            <span class="lw-name">4Founders</span>
            <span class="lw-studio">Studio</span>
          </span>
        </a>
        <p class="claim">Tu negocio, listo para operar.</p>
      </div>
      <div class="footer-col">
        <h5>Navegación</h5>
        <ul>
          <li><a href="/#servicios">Servicios</a></li>
          <li><a href="/#metodologia">Metodología</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Contacto</h5>
        <ul>
          <li><a href="/#contacto">Agenda tu diagnóstico</a></li>
          <li><a href="/guia">Guía gratuita</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="fb-left">
        <span class="fb-mark"><span>4F</span></span>
        <span>Barcelona · España · Latinoamérica</span>
      </div>
      <div class="fb-links">
        <a href="/legal/aviso-legal.html">Aviso legal</a>
        <a href="/legal/privacidad.html">Privacidad</a>
      </div>
    </div>
  </div>
</footer>

<script src="/app.js"></script>
</body>
</html>
`;
}

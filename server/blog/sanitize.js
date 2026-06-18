const ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'blockquote']);

const TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const ON_ATTR_RE = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_HREF_RE = /href\s*=\s*("|')\s*javascript:[^"']*\1/gi;

export function sanitizeBodyHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let out = html.replace(SCRIPT_RE, '');
  out = out.replace(ON_ATTR_RE, '');
  out = out.replace(JS_HREF_RE, 'href="#"');
  out = out.replace(TAG_RE, (match, tag) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (match.startsWith('</')) return `</${name}>`;
    if (name === 'a') {
      const hrefMatch = match.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? (hrefMatch[2] || hrefMatch[3] || hrefMatch[4] || '#') : '#';
      const safeHref = /^https?:\/\//i.test(href) || href.startsWith('/') || href.startsWith('#')
        ? href
        : '#';
      return `<a href="${safeHref.replace(/"/g, '&quot;')}" rel="noopener noreferrer">`;
    }
    return `<${name}>`;
  });
  return out.trim();
}

export function estimateReadingMinutes(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / 200));
}

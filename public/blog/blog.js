/* 4Founders Studio — blog listing */
(function () {
  'use strict';

  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(iso) {
    var parts = String(iso || '').split('-');
    if (parts.length !== 3) return escapeHTML(iso);
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(date.getTime())) return escapeHTML(iso);
    return date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
  }

  function publishedPosts(data) {
    if (!data || !Array.isArray(data.posts)) return [];
    return data.posts
      .filter(function (post) { return post.published !== false; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function renderCard(post) {
    var title = escapeHTML(post.title);
    var url = '/blog/' + encodeURIComponent(post.slug) + '/';
    var cover = post.cover
      ? '<div class="blog-card-media"><img src="' + escapeHTML(post.cover) + '" alt="' + title + '" loading="lazy"><span class="blog-card-arrow" aria-hidden="true">↗</span></div>'
      : '<div class="blog-card-media blog-card-cover--empty" aria-hidden="true"><span class="blog-card-arrow">↗</span></div>';
    var reading = post.readingMinutes ? '<span class="blog-card-meta-sep" aria-hidden="true">·</span><span>' + escapeHTML(post.readingMinutes) + ' min de lectura</span>' : '';
    return (
      '<article class="blog-card">' +
        '<a href="' + url + '" class="blog-card-link" aria-label="Leer: ' + title + '">' +
          cover +
          '<div class="blog-card-body">' +
            '<span class="blog-card-category">' + escapeHTML(post.category) + '</span>' +
            '<h3 class="blog-card-title">' + title + '</h3>' +
            '<p class="blog-card-excerpt">' + escapeHTML(post.excerpt) + '</p>' +
            '<div class="blog-card-meta">' +
              '<time datetime="' + escapeHTML(post.date) + '">' + formatDate(post.date) + '</time>' +
              reading +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>'
    );
  }

  function renderEmpty(container, message) {
    container.innerHTML = '<p class="blog-empty">' + escapeHTML(message) + '</p>';
    container.setAttribute('aria-busy', 'false');
  }

  function mountPosts(container, posts) {
    if (!container) return;
    if (!posts.length) {
      renderEmpty(container, 'Todavía no hay artículos en esta categoría.');
      return;
    }
    container.innerHTML = posts.map(renderCard).join('');
    container.setAttribute('aria-busy', 'false');
  }

  function initFilters(bar, posts, grid) {
    var categories = [];
    posts.forEach(function (post) {
      if (categories.indexOf(post.category) === -1) categories.push(post.category);
    });
    if (categories.length < 2) {
      bar.hidden = true;
      return;
    }

    bar.hidden = false;
    var active = 'all';

    function renderButtons() {
      var html = '<button type="button" class="blog-filter' + (active === 'all' ? ' is-active' : '') + '" data-cat="all" aria-pressed="' + (active === 'all' ? 'true' : 'false') + '">Todos</button>';
      categories.forEach(function (category) {
        var isActive = active === category;
        html += '<button type="button" class="blog-filter' + (isActive ? ' is-active' : '') + '" data-cat="' + escapeHTML(category) + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' + escapeHTML(category) + '</button>';
      });
      bar.innerHTML = html;
      bar.querySelectorAll('.blog-filter').forEach(function (button) {
        button.addEventListener('click', function () {
          active = button.getAttribute('data-cat');
          renderButtons();
          mountPosts(grid, active === 'all' ? posts : posts.filter(function (post) { return post.category === active; }));
        });
      });
    }

    renderButtons();
  }

  function loadAndRender(options) {
    options = options || {};
    return fetch('/blog/posts.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('posts.json unavailable');
        return response.json();
      })
      .then(function (data) {
        var posts = publishedPosts(data);
        if (options.grid) mountPosts(options.grid, posts.slice(0, options.limit || posts.length));
        if (options.filters && options.filterBar) initFilters(options.filterBar, posts, options.grid);
        return posts;
      })
      .catch(function () {
        if (options.grid) renderEmpty(options.grid, 'No hemos podido cargar los artículos. Vuelve a intentarlo en unos minutos.');
        return [];
      });
  }

  function setupMobileNav() {
    var burger = document.getElementById('burger');
    var mobileNav = document.getElementById('mnav');
    if (!burger || !mobileNav) return;

    function closeNav() {
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
    }

    burger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      mobileNav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeNav); });
    closeNav();
  }

  window.BlogPosts = {
    loadAndRender: loadAndRender,
    publishedPosts: publishedPosts,
    formatDate: formatDate,
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileNav();
    var grid = document.getElementById('blogListGrid');
    var filters = document.getElementById('blogFilters');
    if (grid) loadAndRender({ grid: grid, filterBar: filters, filters: true });
  });
})();

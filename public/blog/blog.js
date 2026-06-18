/* ============================================================
   4Founders Studio — blog (listado y teaser)
   ============================================================ */
(function () {
  'use strict';

  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function formatDate(iso) {
    var parts = String(iso || '').split('-');
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function publishedPosts(data) {
    if (!data || !Array.isArray(data.posts)) return [];
    return data.posts
      .filter(function (p) { return p.published !== false; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function renderCard(post) {
    var url = '/blog/' + encodeURIComponent(post.slug) + '/';
    var cover = post.cover
      ? '<div class="blog-card-cover"><img src="' + post.cover + '" alt="" loading="lazy"></div>'
      : '<div class="blog-card-cover blog-card-cover--empty" aria-hidden="true"></div>';
    var read = post.readingMinutes ? post.readingMinutes + ' min' : '';
    return (
      '<article class="blog-card reveal">' +
        '<a href="' + url + '" class="blog-card-link">' +
          cover +
          '<div class="blog-card-body">' +
            '<span class="blog-category">' + post.category + '</span>' +
            '<h3 class="blog-card-title">' + post.title + '</h3>' +
            '<p class="blog-card-excerpt">' + post.excerpt + '</p>' +
            '<div class="blog-meta">' +
              '<time datetime="' + post.date + '">' + formatDate(post.date) + '</time>' +
              (read ? '<span class="blog-meta-sep" aria-hidden="true">·</span><span>' + read + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>'
    );
  }

  function mountPosts(container, posts, limit) {
    if (!container) return;
    var list = limit ? posts.slice(0, limit) : posts;
    if (!list.length) {
      container.innerHTML = '';
      var section = container.closest('[data-blog-section]');
      if (section) section.hidden = true;
      return;
    }
    container.innerHTML = list.map(renderCard).join('');
    container.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  function loadAndRender(opts) {
    opts = opts || {};
    return fetch('/blog/posts.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('posts.json unavailable');
        return res.json();
      })
      .then(function (data) {
        var posts = publishedPosts(data);
        if (opts.grid) mountPosts(opts.grid, posts, opts.limit);
        if (opts.filters && opts.filterBar) initFilters(opts.filterBar, posts, opts.grid);
        return posts;
      })
      .catch(function () {
        if (opts.grid) {
          opts.grid.innerHTML = '';
          var section = opts.grid.closest('[data-blog-section]');
          if (section) section.hidden = true;
        }
        return [];
      });
  }

  function initFilters(bar, posts, grid) {
    var categories = [];
    posts.forEach(function (p) {
      if (categories.indexOf(p.category) === -1) categories.push(p.category);
    });
    if (categories.length < 2) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    var active = 'all';
    function renderButtons() {
      var html = '<button type="button" class="blog-filter' + (active === 'all' ? ' is-active' : '') + '" data-cat="all">Todos</button>';
      categories.forEach(function (cat) {
        html += '<button type="button" class="blog-filter' + (active === cat ? ' is-active' : '') + '" data-cat="' + cat.replace(/"/g, '&quot;') + '">' + cat + '</button>';
      });
      bar.innerHTML = html;
      bar.querySelectorAll('.blog-filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          active = btn.getAttribute('data-cat');
          renderButtons();
          var filtered = active === 'all' ? posts : posts.filter(function (p) { return p.category === active; });
          mountPosts(grid, filtered);
        });
      });
    }
    renderButtons();
  }

  window.BlogPosts = {
    loadAndRender: loadAndRender,
    publishedPosts: publishedPosts,
    formatDate: formatDate,
  };

  document.addEventListener('DOMContentLoaded', function () {
    var landingGrid = document.getElementById('blogTeaserGrid');
    if (landingGrid) {
      loadAndRender({ grid: landingGrid, limit: 3 });
    }
    var listGrid = document.getElementById('blogListGrid');
    var filterBar = document.getElementById('blogFilters');
    if (listGrid) {
      loadAndRender({ grid: listGrid, filterBar: filterBar, filters: true });
    }
  });
})();

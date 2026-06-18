/* ============================================================
   4Founders Studio — interacciones
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Animation capability probe ----------
     The page opts into entrance animations via <html class="anim">.
     If CSS transitions don't actually composite here (e.g. an
     offscreen/non-painting context), strip the class so every
     element falls back to its visible base state immediately.
     Reveals are not armed until this decides, to avoid starting
     a transition that could freeze mid-flight. */
  var revealsStarted = false;
  function probeAnim() {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;transition:opacity .3s linear;pointer-events:none;';
    document.body.appendChild(el);
    void el.offsetHeight;
    el.style.opacity = '1';
    setTimeout(function () {
      var v = parseFloat(getComputedStyle(el).opacity);
      if (!(v > 0.02)) {
        document.documentElement.classList.remove('anim');
      }
      el.parentNode && el.parentNode.removeChild(el);
      startReveals();
    }, 140);
  }

  /* ---------- Header scrolled state ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  function closeNav() {
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', function () {
    var open = mnav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mnav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  /* ---------- Scroll reveal (scroll-based, robust in iframes) ---------- */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));

  /* ---------- Methodology timeline ---------- */
  var timeline = document.getElementById('timeline');
  var tlProgress = document.getElementById('tlProgress');
  var tlSteps = timeline ? timeline.querySelectorAll('.tl-step') : [];
  var timelineLit = false;
  function lightTimeline() {
    if (timelineLit) return;
    timelineLit = true;
    if (tlProgress) tlProgress.style.width = '100%';
    tlSteps.forEach(function (step, i) {
      setTimeout(function () { step.classList.add('lit'); }, 220 + i * 230);
    });
  }

  /* ---------- "A quién acompañamos": lista de perfiles auto-animada ---------- */
  var profList = document.getElementById('profList');
  if (profList) {
    var rows = [].slice.call(profList.querySelectorAll('.pl-row'));
    var pIdx = 0, pTimer = null, pPaused = false;
    var setActive = function (i) {
      rows[pIdx].classList.remove('is-active');
      pIdx = (i + rows.length) % rows.length;
      rows[pIdx].classList.add('is-active');
    };
    var startCycle = function () {
      if (pTimer || rows.length < 2) return;
      pTimer = setInterval(function () { if (!pPaused) setActive(pIdx + 1); }, 2000);
    };
    rows.forEach(function (row, i) {
      row.addEventListener('mouseenter', function () { pPaused = true; setActive(i); });
      row.addEventListener('mouseleave', function () { pPaused = false; });
    });
    startCycle();
  }

  /* ---------- Vídeos de servicios: reproducir sólo en pantalla ---------- */
  var pvids = [].slice.call(document.querySelectorAll('.pv-vid'));
  if (pvids.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target, tile = v.parentNode;
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (v.getAttribute('preload') === 'none') v.preload = 'auto';
          var pr = v.play();
          if (pr && pr.then) {
            pr.then(function () { tile && tile.classList.add('is-playing'); }).catch(function () {});
          } else if (tile) { tile.classList.add('is-playing'); }
        } else {
          v.pause();
          if (tile) tile.classList.remove('is-playing');
        }
      });
    }, { threshold: [0, 0.5, 1] });
    pvids.forEach(function (v) { vio.observe(v); });
  }

  function checkReveals() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals = reveals.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        el.classList.add('in');
        return false;
      }
      return true;
    });
    if (timeline && !timelineLit) {
      var tr = timeline.getBoundingClientRect();
      if (tr.top < vh * 0.7 && tr.bottom > 0) lightTimeline();
    }
  }

  var ticking = false;
  function onScrollReveal() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { checkReveals(); ticking = false; });
  }

  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    window.addEventListener('scroll', onScrollReveal, { passive: true });
    window.addEventListener('resize', onScrollReveal, { passive: true });
    checkReveals();
    /* safety: ensure nothing stays hidden if measurements are off */
    setTimeout(checkReveals, 500);
    setTimeout(function () {
      if (reveals.length) { reveals.forEach(function (el) { el.classList.add('in'); }); reveals = []; }
      lightTimeline();
    }, 3000);
  }

  /* kick off: probe first, then arm reveals */
  probeAnim();
  /* fallback in case the probe timer is starved */
  window.addEventListener('load', function () { setTimeout(startReveals, 600); });

  /* ---------- FAQ accordion ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Form validation ---------- */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }

  function validateField(field) {
    var input = field.querySelector('input, textarea');
    if (!input) return true;
    var v = input.value.trim();
    var ok = true;
    if (input.hasAttribute('required') && v === '') ok = false;
    if (input.type === 'email' && v !== '' && !isEmail(v)) ok = false;
    if (input.type === 'email' && input.hasAttribute('required') && !isEmail(v)) ok = false;
    field.classList.toggle('invalid', !ok);
    return ok;
  }

  function wireForm(formId, okId, errId, endpoint, getPayload) {
    var form = document.getElementById(formId);
    if (!form) return;
    var ok = document.getElementById(okId);
    var errEl = errId ? document.getElementById(errId) : null;
    var submitBtn = form.querySelector('button[type="submit"]');
    var fields = form.querySelectorAll('[data-field]');
    fields.forEach(function (f) {
      var input = f.querySelector('input, textarea, select');
      if (!input) return;
      input.addEventListener('input', function () {
        if (f.classList.contains('invalid')) validateField(f);
        if (errEl) errEl.hidden = true;
      });
      input.addEventListener('blur', function () { validateField(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true;
      fields.forEach(function (f) { if (!validateField(f)) allOk = false; });
      if (!allOk) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      if (errEl) errEl.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.innerHTML;
        submitBtn.textContent = 'Enviando…';
      }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload(form)),
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Error');
          return data;
        });
      }).then(function () {
        form.style.display = 'none';
        if (ok) ok.classList.add('show');
      }).catch(function () {
        if (errEl) errEl.hidden = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.label || submitBtn.innerHTML;
        }
      });
    });
  }

  wireForm('leadForm', 'leadOk', 'leadErr', '/api/lead', function (form) {
    return { email: form.querySelector('[name="email"]').value.trim() };
  });

  wireForm('contactForm', 'contactOk', 'contactErr', '/api/contact', function (form) {
    return {
      nombre: form.querySelector('[name="nombre"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      prefijo: form.querySelector('[name="prefijo"]').value,
      telefono: form.querySelector('[name="telefono"]').value.trim(),
      profesion: form.querySelector('[name="profesion"]').value.trim(),
      descripcion: form.querySelector('[name="descripcion"]').value.trim(),
    };
  });

})();

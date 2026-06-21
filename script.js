/* ═══════════════════════════════════════════════════════════════════
   WildRoam — script.js
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Utility ─────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════ 1. STICKY HEADER ══════════════════════════════ */
(function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  let lastY = 0;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        header.classList.toggle('scrolled', y > 30);
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ═══════════════════ 2. BURGER MENU ════════════════════════════════ */
(function initBurger() {
  const burger = $('#burger');
  const nav    = $('#main-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    nav.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close when any nav link is clicked
  $$('a', nav).forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      nav.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !burger.contains(e.target)) {
      burger.classList.remove('open');
      nav.classList.remove('nav-open');
      document.body.style.overflow = '';
    }
  });
})();

/* ═══════════════════ 3. SECTION REVEAL (Intersection Observer) ═════ */
(function initReveal() {
  const targets = $$('.section-reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach(el => observer.observe(el));
})();

/* ═══════════════════ 4. GALLERY LIGHTBOX ═══════════════════════════ */
(function initLightbox() {
  const lightbox   = $('#lightbox');
  const lbImg      = $('#lightbox-img');
  const closeBtn   = $('#lightbox-close');
  const prevBtn    = $('#lightbox-prev');
  const nextBtn    = $('#lightbox-next');
  const items      = $$('.gallery-item[data-src]');
  if (!lightbox || !items.length) return;

  let currentIndex = 0;
  const srcs = items.map(el => el.dataset.src);
  const alts = items.map(el => $('img', el)?.alt || '');

  function showImage(index) {
    currentIndex = (index + srcs.length) % srcs.length;
    lbImg.style.opacity = '0';
    lbImg.src = srcs[currentIndex];
    lbImg.alt = alts[currentIndex];
    lbImg.onload = () => {
      lbImg.style.transition = 'opacity .3s';
      lbImg.style.opacity = '1';
    };
  }

  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightbox.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(i); });
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
  nextBtn.addEventListener('click', () => showImage(currentIndex + 1));

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) showImage(currentIndex + (dx < 0 ? 1 : -1));
  });
})();

/* ═══════════════════ 5. REVIEWS SLIDER ═════════════════════════════ */
(function initSlider() {
  const slider   = $('#reviews-slider');
  const dotsWrap = $('#slider-dots');
  const prevBtn  = $('#slider-prev');
  const nextBtn  = $('#slider-next');
  if (!slider) return;

  const slides = $$('.review-slide', slider);
  let current  = 0;
  let autoplay;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = $$('.slider-dot', dotsWrap);

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slider.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn?.addEventListener('click', () => { next(); resetAutoplay(); });
  prevBtn?.addEventListener('click', () => { prev(); resetAutoplay(); });

  // Autoplay
  function startAutoplay() {
    autoplay = setInterval(next, 5500);
  }
  function resetAutoplay() {
    clearInterval(autoplay);
    startAutoplay();
  }
  startAutoplay();

  // Pause on hover
  slider.closest('.slider-wrap')?.addEventListener('mouseenter', () => clearInterval(autoplay));
  slider.closest('.slider-wrap')?.addEventListener('mouseleave', startAutoplay);

  // Touch swipe
  let startX = 0;
  slider.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      resetAutoplay();
    }
  });
})();

/* ═══════════════════ 6. FAQ ACCORDION ══════════════════════════════ */
(function initFaq() {
  const questions = $$('.faq-question');
  if (!questions.length) return;

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answer   = btn.nextElementSibling;

      // Close all others
      questions.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      // Toggle this one
      btn.setAttribute('aria-expanded', String(!expanded));
      if (!expanded) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = null;
      }
    });
  });
})();

/* ═══════════════════ 7. BOOKING FORM ═══════════════════════════════ */
(function initForm() {
  const form    = $('#booking-form');
  const success = $('#form-success');
  if (!form) return;

  // Set min date for date inputs
  const today = new Date().toISOString().split('T')[0];
  const dateFrom = $('#date-from');
  const dateTo   = $('#date-to');
  if (dateFrom) dateFrom.min = today;
  if (dateTo)   dateTo.min   = today;

  dateFrom?.addEventListener('change', () => {
    if (dateTo) dateTo.min = dateFrom.value;
    if (dateTo && dateTo.value && dateTo.value < dateFrom.value) {
      dateTo.value = dateFrom.value;
    }
  });

  // Simple field validation highlight
  function validateField(input) {
    const valid = input.checkValidity();
    input.style.borderColor = valid ? '' : 'var(--brown)';
    return valid;
  }

  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('blur', () => { if (field.value) validateField(field); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let allValid = true;
    $$('input[required], select[required], textarea[required]', form).forEach(field => {
      if (!validateField(field)) allValid = false;
    });

    if (!allValid) {
      // Shake the submit button
      const btn = form.querySelector('[type="submit"]');
      btn.style.animation = 'none';
      requestAnimationFrame(() => {
        btn.style.animation = 'shake .4s ease';
      });
      return;
    }

    // Simulate async submission
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.textContent = 'Отправляем…';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.hidden = true;
      if (success) success.hidden = false;
    }, 1200);
  });
})();

/* ═══════════════════ 8. SMOOTH SCROLL for anchor links ═════════════ */
(function initSmoothScroll() {
  const headerH = () => document.getElementById('site-header')?.offsetHeight || 72;

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerH();
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ═══════════════════ 9. FLEET CARD STAGGER ═════════════════════════ */
(function initFleetStagger() {
  const cards = $$('.fleet-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = $$('.fleet-card', entry.target.closest('.fleet-grid') || document);
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'none';
          }, i * 80);
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  // Set initial state via JS (so CSS-only fallback still works)
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity .6s var(--ease-out, cubic-bezier(.22,1,.36,1)), transform .6s var(--ease-out, cubic-bezier(.22,1,.36,1))';
  });

  if (cards[0]) obs.observe(cards[0]);
})();

/* ═══════════════════ 10. ADVANTAGE CARD STAGGER ════════════════════ */
(function initAdvStagger() {
  const cards = $$('.adv-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1), box-shadow .35s, background .3s';
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = $$('.adv-card');
        siblings.forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'none';
          }, i * 100);
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  if (cards[0]) obs.observe(cards[0]);
})();

/* ═══════════════════ 11. CSS Shake animation (injected) ════════════ */
(function injectShakeKeyframe() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();
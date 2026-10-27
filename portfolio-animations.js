/**
 * NAM ATELIER — PORTFOLIO DETAIL ANIMATION ENGINE
 * Part 3: Shared Scroll-Reveal System (IntersectionObserver)
 * Part 4: Continuous Scroll-Linked Progress
 */
(function () {
  'use strict';

  let revealObserver = null;
  let scrollProgressElements = [];
  let rafId = 0;

  /**
   * Immediately marks in-viewport elements as visible to prevent empty states
   */
  function checkInitialVisibility() {
    const vh = window.innerHeight || 800;
    const elements = document.querySelectorAll(
      '.reveal-on-scroll:not(.is-visible), ' +
      '.reveal-image:not(.is-visible), ' +
      '.portfolio-float-item:not(.is-visible), ' +
      '.portfolio-cinematic:not(.is-visible), ' +
      '.portfolio-final:not(.is-visible), ' +
      '.portfolio-heading:not(.is-visible), ' +
      '.portfolio-image-reveal:not(.is-visible)'
    );

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      if (rect.top <= vh * 0.92 && rect.bottom >= 0) {
        el.classList.add('is-visible');
        if (revealObserver) {
          revealObserver.unobserve(el);
        }
      }
    }
  }

  /**
   * Part 3: Shared Scroll-Reveal System
   */
  function initScrollReveal() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll(
      '.reveal-on-scroll, .reveal-image, .portfolio-float-item, ' +
      '.portfolio-cinematic, .portfolio-final, .portfolio-heading, .portfolio-image-reveal'
    );

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    if (revealObserver) {
      revealObserver.disconnect();
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -6% 0px',
      }
    );

    targets.forEach((el) => {
      revealObserver.observe(el);
    });

    checkInitialVisibility();
  }

  /**
   * Part 4: Continuous Scroll-Linked Progress
   */
  function updateScrollProgress() {
    rafId = 0;
    const viewportHeight = window.innerHeight || 1;

    for (let i = 0; i < scrollProgressElements.length; i++) {
      const el = scrollProgressElements[i];
      const rect = el.getBoundingClientRect();

      if (rect.bottom >= -150 && rect.top <= viewportHeight + 150) {
        const total = viewportHeight + rect.height;
        const travelled = viewportHeight - rect.top;
        const progress = Math.max(0, Math.min(1, travelled / total));
        el.style.setProperty('--scroll-progress', progress.toFixed(4));
      }
    }
  }

  function onScrollOrResize() {
    checkInitialVisibility();
    if (!rafId) {
      rafId = requestAnimationFrame(updateScrollProgress);
    }
  }

  function initScrollProgress() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    scrollProgressElements = Array.from(
      document.querySelectorAll('.portfolio-scroll-image, .scroll-image')
    );
    updateScrollProgress();

    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
  }

  window.initPortfolioAnimations = function () {
    initScrollReveal();
    initScrollProgress();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initPortfolioAnimations);
  } else {
    window.initPortfolioAnimations();
  }

  window.addEventListener('load', () => {
    window.initPortfolioAnimations();
    setTimeout(checkInitialVisibility, 200);
  });
})();

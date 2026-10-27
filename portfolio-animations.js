/**
 * NAM ATELIER — COMPLETE PORTFOLIO ANIMATIONS ENGINE
 * Implementation of CODE A (Scroll-Reveal System) & CODE E (Scroll-Progress Parallax)
 */
(function () {
  'use strict';

  let revealObserver = null;
  let scrollProgressElements = [];
  let rafId = 0;

  /**
   * Evaluates viewport intersection and adds .is-visible class
   */
  function checkVisibility() {
    const vh = window.innerHeight || 800;
    const elements = document.querySelectorAll(
      '.reveal:not(.is-visible), .text-mask:not(.is-visible), .portfolio-image-reveal:not(.is-visible), .portfolio-cinematic-section:not(.is-visible)'
    );

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      if (rect.top <= vh * 0.94 && rect.bottom >= 0) {
        el.classList.add('is-visible');
        if (revealObserver) {
          revealObserver.unobserve(el);
        }
      }
    }
  }

  /**
   * CODE A: Scroll-Reveal System using native IntersectionObserver + Event Fallback
   */
  function initScrollReveal() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasObserver = 'IntersectionObserver' in window;

    const targets = document.querySelectorAll(
      '.reveal, .text-mask, .portfolio-image-reveal, .portfolio-cinematic-section'
    );

    if (reduceMotion || !hasObserver) {
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
        threshold: 0.08,
        rootMargin: '0px 0px -4% 0px',
      }
    );

    targets.forEach((el) => {
      revealObserver.observe(el);
    });

    // Initial check for currently visible items
    checkVisibility();
  }

  /**
   * CODE E: Scroll-Progress Parallax System
   */
  function updateScrollProgress() {
    rafId = 0;
    const viewportHeight = window.innerHeight || 1;

    for (let i = 0; i < scrollProgressElements.length; i++) {
      const el = scrollProgressElements[i];
      const rect = el.getBoundingClientRect();

      if (rect.bottom >= -150 && rect.top <= viewportHeight + 150) {
        const progress = Math.max(
          0,
          Math.min(
            1,
            (viewportHeight - rect.top) / (viewportHeight + rect.height)
          )
        );
        el.style.setProperty('--scroll-progress', progress.toFixed(4));
      }
    }
  }

  function onScrollOrResize() {
    checkVisibility();
    if (!rafId) {
      rafId = requestAnimationFrame(updateScrollProgress);
    }
  }

  function initScrollProgress() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    scrollProgressElements = Array.from(document.querySelectorAll('.scroll-image'));
    updateScrollProgress();

    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
  }

  /**
   * Public Re-initialization
   */
  window.initPortfolioAnimations = function () {
    initScrollReveal();
    initScrollProgress();
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.initPortfolioAnimations();
    });
  } else {
    window.initPortfolioAnimations();
  }

  window.addEventListener('load', () => {
    window.initPortfolioAnimations();
  });

  // Safety fallback: run check again after rendering
  setTimeout(() => {
    checkVisibility();
  }, 250);
})();

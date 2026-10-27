/**
 * NAM ATELIER — COMPLETE PORTFOLIO ANIMATION & GSAP ENGINE
 * Part 2 & Part 3: GSAP ScrollTrigger Directional Movement, Pinned Zoom & Image Transitions
 * Part 4: Cursor-Driven Wave Distortion
 */
(function () {
  'use strict';

  // ── PART 4: CURSOR-DRIVEN WAVE DISTORTION ──
  window.handleWaveMove = function (event) {
    const filter = document.getElementById("image-wave-filter");
    if (!filter) return;

    const noise = filter.querySelector(".wave-noise");
    const displacement = filter.querySelector(".wave-displacement");

    const speed = Math.hypot(
      event.movementX || 0,
      event.movementY || 0
    );

    if (noise) {
      const frequency = 0.012 + Math.min(speed * 0.0008, 0.025);
      noise.setAttribute(
        "baseFrequency",
        `${frequency.toFixed(4)} ${(frequency * 1.4).toFixed(4)}`
      );
    }

    if (displacement) {
      const scaleVal = Math.min(24, 5 + speed * 1.2);
      displacement.setAttribute(
        "scale",
        scaleVal.toFixed(2)
      );
    }
  };

  window.handleWaveLeave = function () {
    const filter = document.getElementById("image-wave-filter");
    if (!filter) return;

    const noise = filter.querySelector(".wave-noise");
    const displacement = filter.querySelector(".wave-displacement");

    if (typeof gsap !== 'undefined') {
      gsap.to(displacement, {
        attr: { scale: 0 },
        duration: 0.65,
        ease: "power2.out",
        onComplete: () => {
          if (noise) noise.setAttribute("baseFrequency", "0.012 0.018");
        }
      });
    } else {
      if (noise) noise.setAttribute("baseFrequency", "0.012 0.018");
      if (displacement) displacement.setAttribute("scale", "0");
    }
  };

  function initWaveListeners() {
    const waveImages = document.querySelectorAll('.wave-image');
    waveImages.forEach((img) => {
      img.removeEventListener('pointermove', window.handleWaveMove);
      img.removeEventListener('pointerleave', window.handleWaveLeave);
      img.addEventListener('pointermove', window.handleWaveMove, { passive: true });
      img.addEventListener('pointerleave', window.handleWaveLeave);
    });
  }

  // ── PART 3: GSAP SCROLLTRIGGER ENGINE ──
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const root = document.querySelector(".portfolio-detail-page") || document.body;
    if (!root) return;

    const cards = gsap.utils.toArray(".sa-card", root);
    const floating = gsap.utils.toArray(".sa-float", root);
    const scene = root.querySelector(".sa-scene");
    const zoom = root.querySelector(".sa-zoom-image");
    const layers = gsap.utils.toArray(".sa-zoom-layer", root);
    const progress = root.querySelector(".sa-progress");

    // 1. Reveal images as they enter the viewport
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 42%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // 2. Directional image movement tied to scrolling
    floating.forEach((element, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const distance = 160 + (index % 3) * 40;

      gsap.fromTo(
        element,
        {
          x: direction * distance,
          y: index % 2 === 0 ? 40 : -40,
          scale: 0.9,
          autoAlpha: 0,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "center center",
            scrub: 0.8,
          },
        }
      );
    });

    // 3. Cinematic pinned zoom and image transitions
    if (scene && zoom) {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.2}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .fromTo(
          zoom,
          { scale: 0.82 },
          { scale: 1, duration: 0.7, ease: "none" }
        )
        .to(
          zoom,
          { scale: 1.45, duration: 0.8, ease: "none" }
        );

      // Crossfade existing images in sequence
      layers.forEach((layer, index) => {
        if (index === 0) return;

        const previous = layers[index - 1];
        const position = 0.45 + (index / layers.length) * 1.5;

        timeline
          .to(
            previous,
            { autoAlpha: 0, duration: 0.35, ease: "none" },
            position
          )
          .fromTo(
            layer,
            { autoAlpha: 0, scale: 1.12 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.6,
              ease: "none",
            },
            position
          );
      });

      // Scroll progress indicator
      if (progress) {
        gsap.fromTo(
          progress,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: scene,
              start: "top top",
              end: () => `+=${window.innerHeight * 2.2}`,
              scrub: true,
            },
          }
        );
      }
    }

    // 4. Parallax for elements marked sa-parallax
    gsap.utils.toArray(".sa-parallax", root).forEach((element) => {
      gsap.fromTo(
        element,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  // ── SHARED REVEAL OBSERVER (Native Fallback) ──
  let revealObserver = null;
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

  window.initPortfolioAnimations = function () {
    initScrollReveal();
    initWaveListeners();
    initGSAPAnimations();
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

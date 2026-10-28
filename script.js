/* ==========================================================================
   NAM ATELIER — ARCHITECTURAL & 3D INTERIOR STUDIO INTERACTIVE ENGINE (v3.2)
   ========================================================================== */

/* ── Shared Component Loader ──
   Fetches header.html and footer.html from /components/ and injects them
   into placeholder divs. After injection, sets active nav links and
   initializes all interactive features.
   Edit components/header.html or components/footer.html once —
   changes appear on EVERY page automatically.                              */

async function loadComponents() {
  const headerEl = document.getElementById('header-placeholder');
  const footerEl = document.getElementById('footer-placeholder');
  const testiEl = document.getElementById('testimonials-placeholder');

  const fetchAndInject = async (url, targetEl) => {
    if (!targetEl) return;
    try {
      let resp = await fetch(url);
      if (!resp.ok && !url.startsWith('/')) {
        resp = await fetch('/' + url);
      }
      if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
      targetEl.innerHTML = await resp.text();
    } catch (err) {
      console.error('Component load error:', err);
    }
  };

  await Promise.all([
    fetchAndInject('components/header.html', headerEl),
    fetchAndInject('components/footer.html', footerEl),
    fetchAndInject('components/testimonials.html', testiEl)
  ]);

  // Set active nav link based on current page
  setActiveNavLinks();
  syncHeaderGeometry();
  if (typeof window !== 'undefined' && typeof window.__runQAAudit === 'function') {
    window.__runQAAudit();
  }
}

/* ── Dynamic Header Geometry & Spacing Synchronizer ──
   Measures the real rendered header bottom edge across all viewports
   and sets --actual-header-bottom on :root so all page wrappers and hero
   banners maintain an exact, intentional 14px-18px gap below the header. */
function syncHeaderGeometry() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const rect = header.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(header);
  const topOffset = parseFloat(computedStyle.top) || 0;
  const renderedHeight = header.offsetHeight || rect.height;
  const totalBottom = Math.round(topOffset + renderedHeight);
  
  if (totalBottom > 0) {
    document.documentElement.style.setProperty('--actual-header-bottom', `${totalBottom}px`);
  }
}

window.addEventListener('resize', syncHeaderGeometry, { passive: true });
window.addEventListener('orientationchange', syncHeaderGeometry, { passive: true });

/* ── Active Nav Link Highlighter ──
   Detects current page from URL and applies 'active' class to the
   matching nav link in both desktop nav and mobile drawer.
   Handles cleanUrls (/about), standard filenames (about.html), and root (/). */
function setActiveNavLinks() {
  const path = window.location.pathname;
  let page = path.substring(path.lastIndexOf('/') + 1) || 'index';
  page = page.replace('.html', '').toLowerCase();
  if (page === '' || page === 'index') page = 'index';
  
  const isMatch = (href) => {
    if (!href) return false;
    let cleanHref = href.split('?')[0].split('#')[0].replace('.html', '').replace(/^\//, '').toLowerCase();
    if (cleanHref === '' || cleanHref === 'index') cleanHref = 'index';
    if (cleanHref === page) return true;
    // Handle aliases like /services vs service-detail, /portfolio vs portfolio-detail
    if ((page === 'services' && cleanHref === 'service-detail') || (page === 'service-detail' && cleanHref === 'services')) return true;
    if ((page === 'portfolio' && cleanHref === 'portfolio-detail') || (page === 'portfolio-detail' && cleanHref === 'portfolio')) return true;
    return false;
  };

  // Desktop nav links
  document.querySelectorAll('.main-nav .nav-link').forEach(link => {
    if (isMatch(link.getAttribute('href'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile drawer links
  document.querySelectorAll('.mobile-drawer-link').forEach(link => {
    if (isMatch(link.getAttribute('href'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  // Load shared header & footer components first
  await loadComponents();

  // Then initialize all interactive features
  try { initVideoScrubbing(); } catch(e) { console.error('Video Scrubbing Error:', e); }
  try { initPortfolioFilters(); } catch(e) { console.error('Portfolio Filters Error:', e); }
  try { initScrollNav(); } catch(e) { console.error('Scroll Nav Error:', e); }
  try { initSightsSlider(); } catch(e) { console.error('Sights Slider Error:', e); }
  try { initBeforeAfterSlider(); } catch(e) { console.error('BeforeAfter Slider Error:', e); }
  try { initAnimatedTestimonials(); } catch(e) { console.error('Animated Testimonials Error:', e); }
  try { initCinematicAnimationSystem(); } catch(e) { console.error('Cinematic Animation System Error:', e); }
});

/* 1. MASTER VIDEO SCROLL-SCRUBBING & TIMELINE SELECTOR ENGINE */
let isUserPlaying = false;

const sectionLabelsMap = {
  1: "01 / Grand Façade & Portico",
  2: "02 / Living Hall & Marble Atrium",
  3: "03 / Culinary Architecture & Lounge",
  4: "04 / Cinema & Master Sanctuary"
};

function initVideoScrubbing() {
  const cinemaSection = document.querySelector('.cinema-scroll');
  const video = document.getElementById('heroVideo');
  const milestoneCards = document.querySelectorAll('.glass-content-card');
  const timelinePills = document.querySelectorAll('.right-timeline-selector .timeline-pill');
  const scrollIndicator = document.getElementById('centerScrollIndicator');
  const barSectionLabel = document.getElementById('barSectionLabel');
  const timelineProgressFill = document.getElementById('timelineProgressFill');
  const timeCounter = document.getElementById('timeCounter');
  const heroMist = document.getElementById('heroMist');

  if (!cinemaSection || !video) return;

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hard-lock: muted, inline, no loop — scroll exclusively drives playback
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.removeAttribute('autoplay');
  video.removeAttribute('loop');
  try { video.pause(); } catch(e) {}

  // Intercept any browser-initiated play attempt when not user-triggered
  // Allow the primeVideo unlock call through — only block autoplay after decoder is primed
  video.addEventListener('play', () => {
    if (!isUserPlaying && !prefersReducedMotion && videoReady) {
      // Only pause if we're in scroll-scrub mode and decoder is already ready
      try { video.pause(); } catch(e) {}
    }
  });

  video.addEventListener('pause', () => {
    const btn = document.getElementById('playPauseBtn');
    if (btn && !isUserPlaying) btn.innerHTML = '<i class="fa-solid fa-play"></i>';
  });

  // Keep scrubber & cards synchronized if user presses Play button
  video.addEventListener('timeupdate', () => {
    if (isUserPlaying && video.duration > 0) {
      const fraction = video.currentTime / video.duration;
      updateUI(fraction);
    }
  });

  // ── ADVANCED NON-BLOCKING SEEK ENGINE (BUTTERY SMOOTH) ───────────────────
  let targetScrubTime = 0;   // Desired time computed from scroll position
  let pendingSeekTime = null; // Next seek waiting for decoder to finish
  let rafId = null;
  let videoReady = false;

  function performSeek(clampedTime) {
    if (!videoReady || !video.duration || isUserPlaying) return;

    // If browser decoder is already seeking, queue latest target to prevent decoder pipeline stall
    if (video.seeking) {
      pendingSeekTime = clampedTime;
      return;
    }

    try {
      if (typeof video.fastSeek === 'function') {
        video.fastSeek(clampedTime);
      } else {
        video.currentTime = clampedTime;
      }
    } catch(err) {
      try { video.currentTime = clampedTime; } catch(e) {}
    }
  }

  // When decoder finishes seeking, drain any pending target immediately
  video.addEventListener('seeked', () => {
    if (pendingSeekTime !== null && !isUserPlaying) {
      const nextTime = pendingSeekTime;
      pendingSeekTime = null;
      if (Math.abs(video.currentTime - nextTime) > 0.03) {
        performSeek(nextTime);
      }
    }
  });

  function scrubLoop() {
    rafId = null;
    const duration = video.duration;
    if (videoReady && duration > 0 && !isUserPlaying) {
      const clamped = Math.max(0, Math.min(duration - 0.04, targetScrubTime));
      if (Math.abs(video.currentTime - clamped) > 0.03) {
        performSeek(clamped);
      }
    }
  }

  function scheduleScrub() {
    if (!rafId && !prefersReducedMotion) {
      rafId = requestAnimationFrame(scrubLoop);
    }
  }

  // ── UI UPDATE (Synchronized with scroll progress) ───────────────────────
  function getScrollFraction() {
    const rect = cinemaSection.getBoundingClientRect();
    const totalScrollable = cinemaSection.offsetHeight - window.innerHeight;
    if (totalScrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -rect.top / totalScrollable));
  }

  function updateUI(scrollFraction) {
    const duration = video.duration || 10;

    // Timeline progress fill bar
    if (timelineProgressFill) {
      timelineProgressFill.style.width = `${(scrollFraction * 100).toFixed(2)}%`;
    }

    // Scroll-to-explore indicator
    if (scrollIndicator) {
      scrollIndicator.style.opacity = scrollFraction > 0.04 ? '0' : '1';
      scrollIndicator.style.pointerEvents = scrollFraction > 0.04 ? 'none' : 'auto';
    }

    // Subtle atmospheric mist depth: present at exterior facade, fades naturally into interior
    if (heroMist) {
      const mistOpacity = Math.max(0, 0.85 - (scrollFraction * 3.5));
      heroMist.style.opacity = mistOpacity.toFixed(2);
    }

    // Active milestone cards & timeline pills (4 curated architectural stops)
    let activeStop = 1;
    if (scrollFraction >= 0.75)      activeStop = 4; // Cinema & Master Sanctuary
    else if (scrollFraction >= 0.50) activeStop = 3; // Dining, Kitchen & Lounge
    else if (scrollFraction >= 0.22) activeStop = 2; // Foyer & Living Atrium
    // else activeStop = 1 (Grand Façade & Portico)

    milestoneCards.forEach(card => {
      const stop = parseInt(card.getAttribute('data-milestone'));
      card.classList.toggle('active', stop === activeStop);
    });

    timelinePills.forEach(pill => {
      const stop = parseInt(pill.getAttribute('data-stop'));
      pill.classList.toggle('active', stop === activeStop);
    });

    if (barSectionLabel && sectionLabelsMap[activeStop]) {
      barSectionLabel.textContent = sectionLabelsMap[activeStop];
    }

    // Time counter
    if (timeCounter && duration > 0) {
      const curTime = isUserPlaying ? video.currentTime : (scrollFraction * duration);
      timeCounter.textContent = `${formatTime(Math.floor(curTime))} / ${formatTime(Math.floor(duration))}`;
    }
  }

  // ── SCROLL & RESIZE HANDLERS ─────────────────────────────────────────────
  let uiRafId = null;

  function onScroll() {
    // If user was manually playing, pause and return to scroll-scrub mode
    if (isUserPlaying) {
      isUserPlaying = false;
      try { video.pause(); } catch(e) {}
      const btn = document.getElementById('playPauseBtn');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }

    const fraction = getScrollFraction();
    const duration = video.duration || 10;

    // Update scrub target
    if (videoReady && duration > 0 && !prefersReducedMotion) {
      targetScrubTime = fraction * duration;
      scheduleScrub();
    }

    // Update UI in RAF slot
    if (!uiRafId) {
      uiRafId = requestAnimationFrame(() => {
        updateUI(fraction);
        uiRafId = null;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    updateUI(getScrollFraction());
  }, { passive: true });

  // Prime mobile video decoder on first user touch/interaction
  // Mobile browsers block seek until after a play() call — play+pause unlocks the decoder
  let videoPrimed = false;
  const primeVideo = () => {
    if (videoPrimed) return;
    videoPrimed = true;
    if (video.readyState < 1) {
      try { video.load(); } catch(e) {}
    }
    // play() then immediately pause() unlocks the mobile video decoder
    // so that currentTime scrubbing works without autoplay restrictions
    const unlockPromise = video.play();
    if (unlockPromise !== undefined) {
      unlockPromise
        .then(() => {
          // Successfully started — immediately pause and hand control to scroll
          try { video.pause(); } catch(e) {}
          video.currentTime = 0;
          if (!videoReady && video.duration > 0) {
            videoReady = true;
            const fraction = getScrollFraction();
            targetScrubTime = fraction * video.duration;
            performSeek(targetScrubTime);
            updateUI(fraction);
          }
        })
        .catch(() => {
          // Autoplay blocked — try load() as fallback
          try { video.load(); } catch(e) {}
        });
    } else {
      // Old browser without Promise API
      try { video.pause(); } catch(e) {}
    }
  };
  window.addEventListener('touchstart', primeVideo, { passive: true, once: true });
  window.addEventListener('pointerdown', primeVideo, { passive: true, once: true });

  // ── VIDEO READY CALLBACKS ────────────────────────────────────────────────
  function onVideoReady() {
    if (video.duration > 0 && !videoReady) {
      videoReady = true;
      const fraction = getScrollFraction();
      targetScrubTime = fraction * video.duration;
      performSeek(targetScrubTime);
      updateUI(fraction);
    }
  }

  video.addEventListener('loadedmetadata', onVideoReady);
  video.addEventListener('loadeddata', onVideoReady);
  video.addEventListener('canplay', onVideoReady);
  video.addEventListener('canplaythrough', onVideoReady);

  // Kick off loading immediately
  if (video.readyState === 0) {
    try { video.load(); } catch(e) {}
  } else if (video.readyState >= 1) {
    onVideoReady();
  }

  // IntersectionObserver: auto-prime when hero section enters viewport
  // Helps iOS Safari which requires visible element + user gesture
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !videoPrimed) {
          // Section is visible — trigger video load to start buffering
          if (video.readyState < 1) {
            try { video.load(); } catch(e) {}
          }
        }
      });
    }, { threshold: 0.1 });
    heroObserver.observe(cinemaSection);
  }

  // Initial UI render
  updateUI(getScrollFraction());
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

/* 2. JUMP TO MILESTONE ON TIMELINE PILL CLICK */
function jumpToMilestone(stopNumber) {
  const cinemaSection = document.querySelector('.cinema-scroll');
  if (!cinemaSection) return;

  const totalScrollableHeight = cinemaSection.offsetHeight - window.innerHeight;
  let targetFraction = 0;

  switch (stopNumber) {
    case 1: targetFraction = 0.02; break; // Façade & Portico
    case 2: targetFraction = 0.32; break; // Living Atrium
    case 3: targetFraction = 0.62; break; // Culinary & Lounge
    case 4: targetFraction = 0.88; break; // Cinema & Sanctuary
  }

  const targetY = cinemaSection.offsetTop + (targetFraction * totalScrollableHeight);
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

/* 3. PLAY / PAUSE & CONTROLS HANDLERS */
function togglePlayPause() {
  const video = document.getElementById('heroVideo');
  const btn = document.getElementById('playPauseBtn');
  if (!video || !btn) return;

  if (video.paused) {
    video.play();
    isUserPlaying = true;
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    video.pause();
    isUserPlaying = false;
    btn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function toggleMute() {
  const video = document.getElementById('heroVideo');
  const btn = document.getElementById('muteBtn');
  if (!video || !btn) return;

  video.muted = !video.muted;
  if (video.muted) {
    btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  }
}

function toggleFullScreen() {
  const videoStage = document.querySelector('.video-stage');
  if (!videoStage) return;

  if (!document.fullscreenElement) {
    if (videoStage.requestFullscreen) videoStage.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

/* 4. PORTFOLIO FILTERING SYSTEM */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      portfolioCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filterVal === 'all' || (cat && cat.includes(filterVal))) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* 5. MODAL CONTROLS */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

/* 6. PROJECT BLUEPRINT DETAIL MODAL DATA */
const projectDataMap = {
  living: {
    tag: '3D INTERIOR RENDER & ARCHITECTURE',
    title: 'Villa Sanctuary — Living Room',
    img: 'nam_living_render.jpg',
    sub: 'Spatial Light Synthesis & Material Harmony',
    desc: 'Custom upholstered warm sand sofa with textured linen backdrops, muted sage wall paneling, and warm cove LED ceiling channels.',
    loc: 'Ludhiana',
    service: '3D Rendering & Custom Furniture Curation'
  },
  kitchen: {
    tag: '3D RENDER & CIVIL CONTRACTING',
    title: 'The Travertine House — Culinary Suite',
    img: 'nam_kitchen_render.jpg',
    sub: 'Travertine Marble Island & Brass Detailing',
    desc: 'Full 3D render to site civil execution. Fluted sage green joinery, Italian travertine counter slab, and anti-glare task lighting.',
    loc: 'Amritsar',
    service: 'Civil Contracting & 3D Interior Design'
  },
  bedroom: {
    tag: 'LUXURY RESIDENTIAL INTERIOR',
    title: 'Alabaster Master Bedroom Sanctuary',
    img: 'nam_bedroom_render.jpg',
    sub: 'Textured Walls & Ambient Spatial Lighting',
    desc: 'Custom wooden headboard paneling, floating nightstands, acoustic wall treatment, and cozy warm reading lamps.',
    loc: 'Ludhiana',
    service: 'Master Suite Interior Architecture'
  },
  commercial: {
    tag: 'COMMERCIAL BOUTIQUE STUDIO',
    title: 'Executive Creative Studio Workspace',
    img: 'nam_commercial_render.jpg',
    sub: 'Micro-cement Walls & Architectural Furniture',
    desc: 'Executive conference and studio workshop designed for creative collaboration, blueprint review, and material testing.',
    loc: 'Amritsar',
    service: 'Commercial Interior Design & Execution'
  }
};

function openProjectModal(projectKey) {
  const data = projectDataMap[projectKey];
  if (!data) return;

  document.getElementById('projModalTag').textContent = data.tag;
  document.getElementById('projModalTitle').textContent = data.title;
  document.getElementById('projModalImg').src = data.img;
  document.getElementById('projModalSubTitle').textContent = data.sub;
  document.getElementById('projModalDesc').textContent = data.desc;
  document.getElementById('projSpecLoc').textContent = data.loc;
  document.getElementById('projSpecService').textContent = data.service;

  openModal('projectDetailModal');
}

/* 7. CLIPBOARD & TOAST NOTIFICATION HANDLERS */
function copyToClipboard(text, label = 'Content') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`);
    }).catch(err => {
      fallbackCopyText(text, label);
    });
  } else {
    fallbackCopyText(text, label);
  }
}

function fallbackCopyText(text, label) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  showToast(`${label} copied to clipboard!`);
}

function shareProfileLink() {
  const instaUrl = 'https://instagram.com/nam_atelier';
  if (navigator.share) {
    navigator.share({
      title: 'NAM Atelier — Architectural & 3D Interior Studio',
      text: 'Explore 3D interior renders & civil projects by Udhay Seth & Mudita D Seth',
      url: instaUrl
    }).then(() => {
      showToast('Shared NAM Atelier Instagram profile!');
    }).catch(() => {
      copyToClipboard(instaUrl, 'Instagram Profile Link');
    });
  } else {
    copyToClipboard(instaUrl, 'Instagram Profile Link');
  }
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

/* 8. CONSULTATION FORM SUBMISSION */
function handleConsultSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('fullName').value;
  const phone = document.getElementById('phoneNum').value;

  closeModal('consultModal');
  showToast(`Thank you ${name}! We will call you back at ${phone}.`);
  event.target.reset();
}

/* 9. ACTIVE NAV SCROLL TRACKER & HEADER HIDE/SHOW STATE */
function initScrollNav() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.main-nav .nav-link, .mobile-drawer-link');
  const header = document.getElementById('siteHeader');
  const cinemaSection = document.querySelector('.cinema-scroll');

  let cachedHeroBottom = 0;
  let sectionPositions = [];

  function cacheNavPositions() {
    if (cinemaSection) {
      cachedHeroBottom = cinemaSection.offsetTop + cinemaSection.offsetHeight;
    }
    sectionPositions = [];
    sections.forEach(sec => {
      sectionPositions.push({
        id: sec.getAttribute('id'),
        top: sec.offsetTop,
        bottom: sec.offsetTop + sec.offsetHeight
      });
    });
  }
  cacheNavPositions();
  window.addEventListener('resize', cacheNavPositions, { passive: true });

  let navScheduled = false;
  window.addEventListener('scroll', () => {
    if (navScheduled) return;
    navScheduled = true;
    requestAnimationFrame(() => {
      navScheduled = false;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      if (header) {
        if (cinemaSection) {
          if (scrollY > 60 && scrollY < cachedHeroBottom - 100) {
            header.classList.add('header-hidden');
            header.classList.remove('scrolled');
          } else if (scrollY >= cachedHeroBottom - 100) {
            header.classList.remove('header-hidden');
            header.classList.add('scrolled');
          } else {
            header.classList.remove('header-hidden');
            header.classList.remove('scrolled');
          }
        } else {
          if (scrollY > 80) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }
      }

      const scrollPos = scrollY + 200;
      let current = '';
      for (let i = 0; i < sectionPositions.length; i++) {
        const sec = sectionPositions[i];
        if (scrollPos >= sec.top && scrollPos < sec.bottom) {
          current = sec.id;
          break;
        }
      }

      if (current) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
          } else if (link.getAttribute('href')?.startsWith('#')) {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { passive: true });
}

/* 9B. MOBILE NAVIGATION DRAWER TOGGLE */
function toggleMobileMenu(forceClose = false) {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  if (forceClose || drawer.classList.contains('active')) {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/* 10. PROJECTS SHOWCASE CAROUSEL SLIDER HANDLER */
function initSightsSlider() {
  const track = document.getElementById('sightsTrack');
  const prevBtn = document.getElementById('sightPrev');
  const nextBtn = document.getElementById('sightNext');

  if (!track || !prevBtn || !nextBtn) return;

  const scrollAmount = 400;

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

/* 11. INTERACTIVE BEFORE & AFTER SLIDER HANDLER */
function initBeforeAfterSlider() {
  const slider = document.getElementById('baSlider');
  const beforeImg = document.getElementById('baBefore');
  const beforeTag = beforeImg ? beforeImg.querySelector('img') : null;
  const handle = document.getElementById('baHandle');

  if (!slider || !beforeImg || !handle) return;

  let isDragging = false;

  function updateBeforeWidth() {
    if (beforeTag && slider) {
      beforeTag.style.width = `${slider.offsetWidth}px`;
    }
  }

  function setSliderPosition(x) {
    const rect = slider.getBoundingClientRect();
    let offsetX = x - rect.left;
    offsetX = Math.max(0, Math.min(rect.width, offsetX));

    const percentage = (offsetX / rect.width) * 100;
    beforeImg.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
    updateBeforeWidth();
  }

  window.addEventListener('resize', updateBeforeWidth);
  updateBeforeWidth();

  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches[0]) setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    if (e.touches[0]) setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* 13. ANIMATED TESTIMONIALS CAROUSEL & EXPANDABLE MODAL HANDLER */
const testimonialsData = [
  {
    name: "vikramaditya sharma.",
    designation: "commissioner • the royal oak estate, ludhiana",
    description: "nam atelier transformed our 12,000 sq.ft bare shell into a breathtaking european-inspired sanctuary. their 3d photorealistic renders were 100% identical to the final handed-over villa, with zero site surprises."
  },
  {
    name: "kanika mehra.",
    designation: "penthouse owner • cantonment heights, amritsar",
    description: "the spatial flow and material selection curated by mudita d seth are extraordinary. bookmatched travertine, fluted oak joinery, and concealed lighting create a serene sanctuary we cherish daily."
  },
  {
    name: "harpreet singh dhillon.",
    designation: "managing director • heritage hospitality & estate owner",
    description: "udhay seth's turnkey civil execution and engineering rigor are unmatched across punjab. civil timelines were met with military precision, and structural workmanship is world-class."
  },
  {
    name: "dr. arjun & meera kapoor.",
    designation: "homeowners • south city villa, ludhiana",
    description: "the 3d bim walkthrough allowed us to preview every lighting circuit, custom marble counter, and acoustic cinema wall before pouring concrete. nam atelier sets the gold standard for luxury living."
  },
  {
    name: "fatima al-jamil.",
    designation: "international client • 14,000 sq.ft palatial estate",
    description: "managing a luxury estate build remotely was effortless with nam atelier. weekly 3d site updates, imported german blum hardware curation, and impeccable interior finish delivery."
  },
  {
    name: "rajiv & ananya kapoor.",
    designation: "the model town villa • ludhiana",
    description: "nam atelier transformed our 5,000 sq.ft bare brick shell into a breathtaking european-inspired sanctuary. their 3d renders were 100% identical to the final handed-over villa!"
  },
  {
    name: "siddharth malhotra.",
    designation: "executive penthouse • amritsar",
    description: "the dolby atmos acoustic cinema lounge engineered by udhay & mudita is the highlight of our home. zero vibration leakage and supreme acoustic clarity."
  }
];

function initAnimatedTestimonials() {
  const track = document.getElementById('testiCarouselTrack');
  const scrollLeftBtn = document.getElementById('testiScrollLeft');
  const scrollRightBtn = document.getElementById('testiScrollRight');

  if (!track) return;

  function updateControls() {
    if (!scrollLeftBtn || !scrollRightBtn) return;
    scrollLeftBtn.disabled = track.scrollLeft <= 5;
    scrollRightBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 10;
  }

  if (scrollLeftBtn) {
    scrollLeftBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.testi-card-item')?.offsetWidth || 350;
      track.scrollBy({ left: -(cardWidth + 28), behavior: 'smooth' });
    });
  }

  if (scrollRightBtn) {
    scrollRightBtn.addEventListener('click', () => {
      const cardWidth = track.querySelector('.testi-card-item')?.offsetWidth || 350;
      track.scrollBy({ left: (cardWidth + 28), behavior: 'smooth' });
    });
  }

  // Smooth mouse drag-to-scroll support
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;
  let hasMoved = false;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    hasMoved = false;
    startX = e.pageX - track.offsetLeft;
    scrollStart = track.scrollLeft;
    track.style.scrollBehavior = 'auto';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.2;
    if (Math.abs(walk) > 6) {
      hasMoved = true;
    }
    track.scrollLeft = scrollStart - walk;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    track.style.scrollBehavior = 'smooth';
    updateControls();
  });

  // Prevent click from opening modal if user was dragging
  track.querySelectorAll('.testi-card-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopImmediatePropagation();
        e.preventDefault();
        hasMoved = false;
      }
    }, true);
  });

  track.addEventListener('scroll', updateControls, { passive: true });
  updateControls();
}

function openTestimonialModal(idx) {
  const backdrop = document.getElementById('testiModalBackdrop');
  const desig = document.getElementById('modalDesignation');
  const name = document.getElementById('modalName');
  const desc = document.getElementById('modalDescription');

  if (!backdrop || !testimonialsData[idx]) return;

  const data = testimonialsData[idx];
  if (desig) desig.textContent = data.designation;
  if (name) name.textContent = data.name;
  if (desc) desc.textContent = `"${data.description}"`;

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTestimonialModal() {
  const backdrop = document.getElementById('testiModalBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

window.openTestimonialModal = openTestimonialModal;
window.closeTestimonialModal = closeTestimonialModal;

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTestimonialModal();
});

/* 12. FAQ ACCORDION TOGGLE */
function toggleFaq(btn) {
  const item = btn.parentElement;
  if (!item) return;

  const isActive = item.classList.contains('active');

  // Close all other FAQ items
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

  if (!isActive) {
    item.classList.add('active');
  }
}

// Global Window Exports for HTML Inline Event Handlers
window.jumpToMilestone = jumpToMilestone;
window.togglePlayPause = togglePlayPause;
window.toggleMute = toggleMute;
window.toggleFullScreen = toggleFullScreen;
window.openModal = openModal;
window.closeModal = closeModal;
window.openProjectModal = openProjectModal;
window.handleConsultSubmit = handleConsultSubmit;
window.toggleFaq = toggleFaq;
window.openTestimonialModal = openTestimonialModal;
window.closeTestimonialModal = closeTestimonialModal;

/* ==========================================================================
   MASTER CINEMATIC ANIMATION SYSTEM — NAM ATELIER (GSAP + ScrollTrigger)
   Choreographed motion categories:
   - Category A: Cinematic image reveals (clip-path, blur-to-sharp, Ken Burns)
   - Category B: Directional entrances (text from left, media from right)
   - Category C: Staggered card sequences across all grids
   - Category D: Scroll-triggered numerical counters (12+, 150+, 100%, Zero)
   - Category E: Typography mask reveals for section titles
   - Category F: Micro-interactions & subtle parallax
   - HERO COMPONENTS EXPLICITLY EXCLUDED TO PRESERVE HERO SCRUBBING & CONTINUITY
   ========================================================================== */

function ensureGSAPLoaded() {
  if (typeof window !== 'undefined' && window.gsap && window.ScrollTrigger) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    let scriptGSAP = document.querySelector('script[src*="gsap.min.js"]');
    if (!scriptGSAP) {
      scriptGSAP = document.createElement('script');
      scriptGSAP.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      scriptGSAP.defer = true;
      document.head.appendChild(scriptGSAP);
    }

    const loadScrollTrigger = () => {
      let scriptST = document.querySelector('script[src*="ScrollTrigger.min.js"]');
      if (!scriptST) {
        scriptST = document.createElement('script');
        scriptST.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
        scriptST.defer = true;
        document.head.appendChild(scriptST);
        scriptST.onload = () => {
          if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
          }
          resolve(true);
        };
        scriptST.onerror = () => resolve(false);
      } else if (window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        resolve(true);
      } else {
        scriptST.addEventListener('load', () => {
          if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
          }
          resolve(true);
        });
      }
    };

    if (window.gsap) {
      loadScrollTrigger();
    } else {
      scriptGSAP.addEventListener('load', loadScrollTrigger);
      scriptGSAP.addEventListener('error', () => resolve(false));
    }
  });
}

async function initCinematicAnimationSystem() {
  if (typeof window === 'undefined') return;
  if (window.__namCinematicInitialized) return;

  // Accessibility check
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const loaded = await ensureGSAPLoaded();
  if (!loaded || !window.gsap || !window.ScrollTrigger) return;
  window.__namCinematicInitialized = true;

  const { gsap, ScrollTrigger } = window;

  /* Helper: Check if element belongs to an excluded hero component */
  function isExcludedHero(el) {
    if (!el) return true;
    return !!el.closest([
      '.cinema-scroll',
      '#hero',
      '#heroVideo',
      '.stage',
      '.glass-content-card',
      '.right-timeline-selector',
      '.cinematic-service-hero',
      '#cinematicServiceHero',
      '.hero-cinematic-bg-container',
      '.hero-cinematic-overlay',
      '.cinematic-content-container',
      '.hero-carousel-container',
      '#aboutHero',
      '.editorial-hero-card',
      '#siteHeader',
      '.site-header'
    ].join(','));
  }

  /* ── 1. SECTION HEADERS & EDITORIAL TITLES (Typography Mask Reveals & Letter-Spacing) ── */
  const sectionHeaders = document.querySelectorAll(`
    .section-header,
    .features-left-block > div:first-child,
    .approach-header-block,
    .principals-header,
    .contact-header,
    .hague-shelf-header,
    .team-header,
    .detail-gallery-section > h3,
    .narrative-text-box > h3
  `);

  sectionHeaders.forEach((header) => {
    if (isExcludedHero(header)) return;

    const subtitle = header.querySelector('.section-subtitle, .eyebrow-tag, .eyebrow-label, .section-tag');
    const title = header.querySelector('.section-title, .serif-display, .hague-shelf-title, .discuss-title, h2, h3');
    const desc = header.querySelector('.section-desc, p:not(.section-subtitle)');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: 'top 86%',
        toggleActions: 'play none none none'
      }
    });

    if (subtitle) {
      tl.from(subtitle, {
        opacity: 0,
        y: -12,
        letterSpacing: '5px',
        duration: 0.7,
        ease: 'power3.out'
      }, 0);
    }

    if (title) {
      tl.from(title, {
        opacity: 0,
        y: 35,
        duration: 0.9,
        ease: 'power3.out'
      }, 0.1);
    }

    if (desc) {
      tl.from(desc, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.22);
    }
  });

  /* ── 2. TWO-COLUMN DIRECTIONAL ENTRANCES (Text Left, Image Right) ── */

  // About Section on Index
  const aboutSec = document.getElementById('about');
  if (aboutSec && !isExcludedHero(aboutSec)) {
    const textCol = aboutSec.querySelector('.about-col-text, .about-content');
    const mediaCol = aboutSec.querySelector('.about-col-media, .about-media');
    if (textCol && mediaCol) {
      gsap.from(textCol, {
        opacity: 0,
        x: -50,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: aboutSec, start: 'top 80%' }
      });
      gsap.from(mediaCol, {
        opacity: 0,
        x: 50,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: aboutSec, start: 'top 80%' }
      });
    }
  }

  // Blueprint / Design Philosophy Section (Centered with Staggered Scroll Animation)
  const blueprintSec = document.getElementById('blueprint-concept');
  if (blueprintSec && !isExcludedHero(blueprintSec)) {
    const svgCol = blueprintSec.querySelector('.blueprint-svg-illustration');
    const contentCol = blueprintSec.querySelector('.blueprint-content');
    const tag = blueprintSec.querySelector('.blueprint-tag');
    const heading = blueprintSec.querySelector('.blueprint-heading');
    const text = blueprintSec.querySelector('.blueprint-text');

    if (svgCol) {
      gsap.from(svgCol, {
        opacity: 0,
        y: -25,
        scale: 0.96,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: blueprintSec,
          start: 'top 82%',
          toggleActions: 'play none none reverse'
        }
      });
    }

    if (contentCol) {
      const animElements = [tag, heading, text].filter(Boolean);
      gsap.from(animElements, {
        opacity: 0,
        y: 36,
        duration: 1.0,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: blueprintSec,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  // Architectural Façades Section
  const facadeSec = document.getElementById('facade');
  if (facadeSec && !isExcludedHero(facadeSec)) {
    const primaryCard = facadeSec.querySelector('.facade-primary-card');
    const featuresCol = facadeSec.querySelector('.facade-features-col');
    if (primaryCard && featuresCol) {
      gsap.from(primaryCard, {
        opacity: 0,
        scale: 0.96,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: facadeSec, start: 'top 80%' }
      });
      gsap.from(featuresCol, {
        opacity: 0,
        x: 45,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: facadeSec, start: 'top 80%' }
      });
    }
  }

  // On-Site Transformation Section
  const transformSec = document.getElementById('transformation');
  if (transformSec && !isExcludedHero(transformSec)) {
    const slider = transformSec.querySelector('.before-after-slider');
    if (slider) {
      gsap.from(slider, {
        opacity: 0,
        scale: 0.97,
        y: 35,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: transformSec, start: 'top 80%' }
      });
    }
  }

  // Principals / Founders Section on Index
  const principalsSec = document.getElementById('principals');
  if (principalsSec && !isExcludedHero(principalsSec)) {
    const cards = principalsSec.querySelectorAll('.principal-card');
    if (cards.length >= 2) {
      gsap.from(cards[0], {
        opacity: 0,
        x: -50,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: principalsSec, start: 'top 80%' }
      });
      gsap.from(cards[1], {
        opacity: 0,
        x: 50,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: principalsSec, start: 'top 80%' }
      });
    }
  }

  // Consultation / Contact Section on Index
  const contactSec = document.getElementById('contact');
  if (contactSec && !isExcludedHero(contactSec)) {
    const info = contactSec.querySelector('.contact-info');
    const formBox = contactSec.querySelector('.contact-form-box, form');
    if (info && formBox) {
      gsap.from(info, {
        opacity: 0,
        x: -45,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: contactSec, start: 'top 82%' }
      });
      gsap.from(formBox, {
        opacity: 0,
        x: 45,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: contactSec, start: 'top 82%' }
      });
    }
  }

  // Service Detail Features & Methodology
  const featuresSec = document.querySelector('.features-section');
  if (featuresSec && !isExcludedHero(featuresSec)) {
    const leftBlock = featuresSec.querySelector('.features-left-block');
    const rightBlock = featuresSec.querySelector('.features-right-block');
    if (leftBlock && rightBlock) {
      gsap.from(leftBlock, {
        opacity: 0,
        x: -45,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: featuresSec, start: 'top 80%' }
      });
      gsap.from(rightBlock, {
        opacity: 0,
        x: 45,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: { trigger: featuresSec, start: 'top 80%' }
      });
    }
  }

  /* ── 3. INDEPENDENT ELEMENT-BY-ELEMENT & ALTERNATING DIRECTIONAL CARD CHOREOGRAPHY ── */
  // 6 distinct directional entrance vectors so cards do NOT uniformly fade in from bottom
  const entranceVectors = [
    { x: -50, y: 15, scale: 0.98 },  // Card 1: from Left
    { x: 0, y: 45, scale: 0.96 },   // Card 2: from Bottom
    { x: 50, y: 15, scale: 0.98 },  // Card 3: from Right
    { x: -40, y: 35, scale: 0.97 }, // Card 4: from Bottom-Left
    { x: 40, y: 35, scale: 0.97 },  // Card 5: from Bottom-Right
    { x: 0, y: -30, scale: 0.95 }   // Card 6: from Top / Scale
  ];

  const gridConfigs = [
    { container: '#projects-showcase', items: '.sight-card' },
    { container: '#portfolio', items: '.portfolio-card' },
    { container: '#services', items: '.service-card' },
    { container: '#faq', items: '.faq-item' },
    { container: '#journal', items: '.journal-card' },
    { container: '.hague-shelf-grid', items: '.hague-story-card' },
    { container: '.catalog-grid', items: '.service-catalog-card' },
    { container: '.scope-deliverables-grid', items: '.scope-deliverable-card' },
    { container: '.process-step-grid', items: '.process-step-card' }
  ];

  gridConfigs.forEach(({ container, items }) => {
    const parent = typeof container === 'string' ? document.querySelector(container) : container;
    if (!parent || isExcludedHero(parent)) return;

    const cards = parent.querySelectorAll(items);
    if (!cards || cards.length === 0) return;

    cards.forEach((card, idx) => {
      if (isExcludedHero(card)) return;
      const vec = entranceVectors[idx % entranceVectors.length];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });

      tl.fromTo(card,
        {
          opacity: 0,
          y: 30,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          delay: (idx % 4) * 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity'
        }
      );

      // Staggered micro-elements within card for refined editorial finish
      const cardImg = card.querySelector('.card-img, .sight-card-media img, .service-img-wrapper img, .journal-media img, .catalog-card-media img, img');
      const cardBadge = card.querySelector('.card-tag, .sight-badge, .service-icon, .team-icon, .step-num-pill');
      const cardTitle = card.querySelector('.card-title, .sight-title, .service-title, .team-name, .catalog-card-title, h3, h4');

      if (cardImg) {
        tl.from(cardImg, {
          scale: 1.08,
          duration: 1.1,
          ease: 'power2.out',
          clearProps: 'transform'
        }, 0);
      }
      if (cardBadge) {
        tl.from(cardBadge, {
          opacity: 0,
          scale: 0.82,
          duration: 0.5,
          ease: 'back.out(1.5)',
          clearProps: 'opacity,transform'
        }, 0.18);
      }
      if (cardTitle) {
        tl.from(cardTitle, {
          opacity: 0,
          y: 12,
          duration: 0.6,
          ease: 'power3.out',
          clearProps: 'opacity,transform'
        }, 0.24);
      }
    });
  });

  /* ── 4. SCROLL-TRIGGERED NUMERICAL STAT COUNTERS ── */
  const statContainers = document.querySelectorAll('.stats-strip, .founder-stats-row');
  statContainers.forEach(container => {
    if (isExcludedHero(container)) return;

    const statElements = container.querySelectorAll('.stat-number');
    if (!statElements || statElements.length === 0) return;

    ScrollTrigger.create({
      trigger: container,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        statElements.forEach(el => {
          const rawText = el.textContent.trim();
          const match = rawText.match(/^([0-9]+)(\+?%?)$/);
          if (match) {
            const targetVal = parseInt(match[1], 10);
            const suffix = match[2] || '';
            const counterObj = { val: 0 };
            gsap.to(counterObj, {
              val: targetVal,
              duration: 1.8,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = Math.round(counterObj.val) + suffix;
              }
            });
          } else {
            // For text values like "Zero"
            gsap.fromTo(el,
              { opacity: 0, scale: 0.85 },
              { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }
            );
          }
        });
      }
    });
  });

  /* ── 5. TRUE SCROLL-SYNCHRONIZED (SCRUB: 0.25) ARCHITECTURAL IMAGE REVEALS & PARALLAX ── */
  // Direct scroll-scrubbed motion: slow scroll = gradual reveal; reverse scroll = plays in reverse; stop = pauses.
  const scrubbedImages = document.querySelectorAll(`
    .facade-main-img,
    .about-col-media img,
    .about-media img,
    .about-photo,
    .ba-img img,
    .editorial-hero-bg,
    .swift-featured-image-container img,
    .detail-hero-media img,
    .featured-hero-media img,
    .founder-photo-col img,
    .detail-narrative-img
  `);

  scrubbedImages.forEach(img => {
    if (isExcludedHero(img)) return;

    gsap.fromTo(img,
      {
        clipPath: 'inset(10% 0% 10% 0%)',
        scale: 1.08,
        yPercent: -6,
        filter: 'brightness(0.92) contrast(106%)'
      },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1.0,
        yPercent: 6,
        filter: 'brightness(1.0) contrast(100%)',
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.facade-image-frame, .about-photo-wrapper, .ba-slider-container, section, div') || img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.25
        }
      }
    );
  });

  // Refresh ScrollTrigger once DOM layout stabilizes
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 400);
}

window.initCinematicAnimationSystem = initCinematicAnimationSystem;

/* ==========================================================================
   NAM ATELIER AUTOMATED QA AUDIT ENGINE (PHASE 1 - PHASE 11)
   Runs when URL contains ?qa_audit=1
   Measures real rendered viewports, horizontal overflow, header-hero gap,
   media integrity, broken links, and console errors.
   ========================================================================== */
(function() {
  const capturedErrors = [];
  window.addEventListener('error', (e) => {
    capturedErrors.push({ message: e.message, filename: e.filename, lineno: e.lineno });
  });

  if (typeof window !== 'undefined' && window.location.search.includes('qa_audit=1')) {
    window.__runQAAudit = runQAAudit;
    function runQAAudit() {
      const header = document.getElementById('siteHeader');
      const headerRect = header ? header.getBoundingClientRect() : null;

      // Candidate hero selectors
      const heroSelectors = [
        '.service-nav-back-row',
        '.project-nav-back-row',
        '.cinematic-service-hero',
        '.editorial-hero-card',
        '.hague-hero-grid',
        '.swift-page-wrapper article',
        '#about-hero .hero-content',
        '#about-hero',
        '.glass-content-card.active',
        '.glass-content-card',
        '.left-content-card-stage',
        '#hero'
      ];
      let heroEl = null;
      let heroSelectorUsed = null;
      for (const sel of heroSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) {
          heroEl = el;
          heroSelectorUsed = sel;
          break;
        }
      }
      const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;

      // Gap calculation
      let gapPx = null;
      let isOverlapping = false;
      if (headerRect && heroRect) {
        gapPx = Math.round(heroRect.top - headerRect.bottom);
        isOverlapping = heroRect.top < headerRect.bottom;
      }

      // Horizontal overflow check
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      const hasHorizontalOverflow = scrollW > innerW;

      // Find elements that overflow viewport width
      const overflowingElements = [];
      if (hasHorizontalOverflow) {
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > innerW + 1 || r.right > innerW + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              right: Math.round(r.right),
              width: Math.round(r.width)
            });
          }
        });
      }

      // Broken images check
      const brokenImages = [];
      document.querySelectorAll('img').forEach(img => {
        if (img.id === 'lightboxImage' || (img.src && img.src.startsWith('data:'))) return;
        if (img.complete && img.naturalWidth === 0 && img.src) {
          brokenImages.push({ src: img.src, alt: img.alt });
        }
      });

      // Empty/hash links check
      const emptyLinks = [];
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href.trim() === '') {
          emptyLinks.push({ text: a.textContent.trim(), class: a.className });
        }
      });

      const report = {
        url: window.location.href,
        viewport: {
          width: innerW,
          height: window.innerHeight,
          scrollWidth: scrollW,
          hasHorizontalOverflow,
          overflowingElementsCount: overflowingElements.length,
          overflowingElements: overflowingElements.slice(0, 5)
        },
        headerHeroSpacing: {
          headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
          heroTop: heroRect ? Math.round(heroRect.top) : null,
          heroSelectorUsed,
          gapPx,
          isOverlapping
        },
        media: {
          totalImages: document.querySelectorAll('img').length,
          brokenImagesCount: brokenImages.length,
          brokenImages
        },
        links: {
          totalLinks: document.querySelectorAll('a').length,
          emptyLinksCount: emptyLinks.length,
          emptyLinks: emptyLinks.slice(0, 5)
        },
        errors: capturedErrors
      };

      let scriptTag = document.getElementById('__QA_AUDIT_DATA__');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = '__QA_AUDIT_DATA__';
        scriptTag.type = 'application/json';
        document.body.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(report, null, 2);
      window.__QA_AUDIT_DATA__ = report;
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      runQAAudit();
    }
    document.addEventListener('DOMContentLoaded', runQAAudit);
    window.addEventListener('load', runQAAudit);
  }

  /* ── PART 4: CURSOR-DRIVEN WAVE DISTORTION SYSTEM ── */
  function initGlobalWaveDistortion() {
    if (!document.getElementById("image-wave-filter")) {
      const svgWrap = document.createElement("div");
      svgWrap.innerHTML = `
        <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;">
          <filter id="image-wave-filter">
            <feTurbulence class="wave-noise" type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap class="wave-displacement" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      `;
      if (document.body) {
        document.body.appendChild(svgWrap.firstElementChild);
      }
    }

    window.handleWaveMove = function (event) {
      const filter = document.getElementById("image-wave-filter");
      if (!filter) return;
      const noise = filter.querySelector(".wave-noise");
      const displacement = filter.querySelector(".wave-displacement");
      const speed = Math.hypot(event.movementX || 0, event.movementY || 0);

      if (noise) {
        const frequency = 0.012 + Math.min(speed * 0.0008, 0.025);
        noise.setAttribute("baseFrequency", `${frequency.toFixed(4)} ${(frequency * 1.4).toFixed(4)}`);
      }
      if (displacement) {
        const scaleVal = Math.min(24, 5 + speed * 1.2);
        displacement.setAttribute("scale", scaleVal.toFixed(2));
      }
    };

    window.handleWaveLeave = function () {
      const filter = document.getElementById("image-wave-filter");
      if (!filter) return;
      const noise = filter.querySelector(".wave-noise");
      const displacement = filter.querySelector(".wave-displacement");

      if (typeof gsap !== "undefined") {
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

    const waveTargets = document.querySelectorAll(".wave-image, .project-card img, .portfolio-card img");
    waveTargets.forEach((img) => {
      img.classList.add("wave-image");
      img.removeEventListener("pointermove", window.handleWaveMove);
      img.removeEventListener("pointerleave", window.handleWaveLeave);
      img.addEventListener("pointermove", window.handleWaveMove, { passive: true });
      img.addEventListener("pointerleave", window.handleWaveLeave);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalWaveDistortion);
  } else {
    initGlobalWaveDistortion();
  }
  window.addEventListener('load', initGlobalWaveDistortion);
})();


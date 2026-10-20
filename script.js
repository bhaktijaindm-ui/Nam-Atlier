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
    fetchAndInject('components/footer.html', footerEl)
  ]);

  // Set active nav link based on current page
  setActiveNavLinks();
}

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
    scrollLeftBtn.disabled = track.scrollLeft <= 0;
    scrollRightBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 5;
  }

  if (scrollLeftBtn) {
    scrollLeftBtn.addEventListener('click', () => {
      track.scrollBy({ left: -360, behavior: 'smooth' });
    });
  }

  if (scrollRightBtn) {
    scrollRightBtn.addEventListener('click', () => {
      track.scrollBy({ left: 360, behavior: 'smooth' });
    });
  }

  track.addEventListener('scroll', updateControls);
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


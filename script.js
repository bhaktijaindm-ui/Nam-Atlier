/* ==========================================================================
   NAM ATELIER — ARCHITECTURAL & 3D INTERIOR STUDIO INTERACTIVE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  try { initVideoScrubbing(); } catch(e) { console.error('Video Scrubbing Error:', e); }
  try { initPortfolioFilters(); } catch(e) { console.error('Portfolio Filters Error:', e); }
  try { initScrollNav(); } catch(e) { console.error('Scroll Nav Error:', e); }
  try { initSightsSlider(); } catch(e) { console.error('Sights Slider Error:', e); }
  try { initBeforeAfterSlider(); } catch(e) { console.error('BeforeAfter Slider Error:', e); }
  try { initAnimatedTestimonials(); } catch(e) { console.error('Animated Testimonials Error:', e); }
});

/* 1. MASTER VIDEO LERP SCRUBBING & TIMELINE SELECTOR ENGINE */
let videoScrubTargetTime = 0;
let videoScrubCurrentTime = 0;
let isUserPlaying = false;

const sectionLabelsMap = {
  1: "01 / Grand Facade & Entrance",
  2: "02 / Living Hall & Travertine Atrium",
  3: "03 / Mezzanine Level & Cantilever Stairs",
  4: "04 / Private Sanctuary & Theater"
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

  if (!cinemaSection || !video) return;

  // Ensure video is muted for frame-accurate scroll scrubbing
  video.muted = true;
  video.pause();

  function updateVideoScrub() {
    const rect = cinemaSection.getBoundingClientRect();
    const totalScrollableHeight = cinemaSection.offsetHeight - window.innerHeight;
    
    // Calculate scroll fraction (0.0 to 1.0)
    let scrollFraction = -rect.top / totalScrollableHeight;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    // Update bottom timeline progress fill bar
    if (timelineProgressFill) {
      timelineProgressFill.style.width = `${(scrollFraction * 100).toFixed(1)}%`;
    }

    // Fade out center scroll indicator on scroll
    if (scrollIndicator) {
      if (scrollFraction > 0.04) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
      }
    }

    // Determine active milestone based on scroll progress:
    // Milestone 1: 0% - 20%
    // Milestone 2: 20% - 50%
    // Milestone 3: 50% - 75%
    // Milestone 4: 75% - 100%
    let activeStop = 1;
    if (scrollFraction >= 0.75) {
      activeStop = 4;
    } else if (scrollFraction >= 0.50) {
      activeStop = 3;
    } else if (scrollFraction >= 0.20) {
      activeStop = 2;
    } else {
      activeStop = 1;
    }

    // Update Left Content Card Swapping with smooth fade/slide
    milestoneCards.forEach(card => {
      const cardStop = parseInt(card.getAttribute('data-milestone'));
      if (cardStop === activeStop) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Right Timeline Selector Pills
    timelinePills.forEach(pill => {
      const pillStop = parseInt(pill.getAttribute('data-stop'));
      if (pillStop === activeStop) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update Bottom Bar Label
    if (barSectionLabel && sectionLabelsMap[activeStop]) {
      barSectionLabel.textContent = sectionLabelsMap[activeStop];
    }

    // Update target video playback time based on scroll position if not playing manually
    if (video.duration && !isUserPlaying) {
      videoScrubTargetTime = scrollFraction * video.duration;
    }
  }

  // 60FPS LERP animation loop to eliminate frame jumps
  function renderLoop() {
    if (video.duration) {
      if (!isUserPlaying) {
        videoScrubCurrentTime += (videoScrubTargetTime - videoScrubCurrentTime) * 0.12;
        if (Math.abs(videoScrubTargetTime - videoScrubCurrentTime) > 0.001) {
          video.currentTime = videoScrubCurrentTime;
        }
      } else {
        videoScrubCurrentTime = video.currentTime;
      }

      // Update Digital Time Counter (e.g., "00:12 / 00:33")
      if (timeCounter) {
        const curSec = Math.floor(video.currentTime);
        const durSec = Math.floor(video.duration);
        timeCounter.textContent = `${formatTime(curSec)} / ${formatTime(durSec)}`;
      }
    }
    requestAnimationFrame(renderLoop);
  }

  window.addEventListener('scroll', updateVideoScrub, { passive: true });
  window.addEventListener('resize', updateVideoScrub);

  requestAnimationFrame(renderLoop);
  updateVideoScrub();
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
    case 1: targetFraction = 0.02; break;
    case 2: targetFraction = 0.32; break;
    case 3: targetFraction = 0.62; break;
    case 4: targetFraction = 0.90; break;
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
/* 9. ACTIVE NAV SCROLL TRACKER */
function initScrollNav() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.main-nav .nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        current = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
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
  const handle = document.getElementById('baHandle');

  if (!slider || !beforeImg || !handle) return;

  let isDragging = false;

  function setSliderPosition(x) {
    const rect = slider.getBoundingClientRect();
    let offsetX = x - rect.left;
    offsetX = Math.max(0, Math.min(rect.width, offsetX));

    const percentage = (offsetX / rect.width) * 100;
    beforeImg.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }

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
    name: "priya sharma.",
    designation: "data scientist at quantumleap & villa owner",
    description: "this platform revolutionized our spatial planning and data analysis process. the 3d render speed and structural accuracy are unparalleled. a must-have for any high-end architectural project."
  },
  {
    name: "marcus johnson.",
    designation: "head of operations at synergy corp",
    description: "the user interface is incredibly intuitive, which made reviewing 3d vr walkthroughs for my team a breeze. we finalized civil plans in hours, not days."
  },
  {
    name: "isabella rossi.",
    designation: "client success manager at horizon",
    description: "customer support and turnkey civil execution are top-notch. udhay & mudita are responsive, knowledgeable, and genuinely invested in building your architectural dream home."
  },
  {
    name: "kenji tanaka.",
    designation: "software engineer at codecrafters",
    description: "i'm impressed by the constant stream of updates, german blum hardware sourcing, and custom acoustic cinema isolation. the development team is clearly passionate."
  },
  {
    name: "fatima al-jamil.",
    designation: "cfo at apex financial & estate owner",
    description: "the roi on our 14,000 sq.ft palatial estate was immediate. it streamlined our civil workflows so effectively that project delivery times were cut by nearly 30%."
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

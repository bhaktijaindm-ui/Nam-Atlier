/* ==========================================================================
   THE JAIPUR ATELIER — CINEMATIC 3D SCROLL & INTERACTIVE ENGINE
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // --------------------------------------------------------------------------
  // 1. DATA: 6 SIGNATURE DESIGN PROJECTS (CLONED 3X = 18 CARDS)
  // --------------------------------------------------------------------------
  const projects = [
    {
      title: "The Obsidian Penthouse",
      type: "Penthouse Interior",
      desc: "Double-height monolithic stone living hall with floating staircase.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
      location: "New Delhi"
    },
    {
      title: "The Rosewood Villa",
      type: "Chef's Kitchen & Dining",
      desc: "Fluted dark oak joinery with integrated quartz island and smart prep station.",
      image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80",
      location: "Mumbai"
    },
    {
      title: "The Velvet Cinema Lounge",
      type: "Acoustic Theatre",
      desc: "Dolby Atmos 9.4.4 private theatre with motorized emerald recliners.",
      image: "https://images.unsplash.com/photo-1595935736128-db1f0a261263?auto=format&fit=crop&w=1000&q=80",
      location: "Jaipur"
    },
    {
      title: "Amber Heritage Suite",
      type: "Master Bedroom",
      desc: "Bespoke brass inlays, fluted acoustic bedhead, and integrated walk-in spa wardrobe.",
      image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1000&q=80",
      location: "Bengaluru"
    },
    {
      title: "Zen Courtyard Pavilion",
      type: "Indoor-Outdoor Living",
      desc: "Sunken conversation lounge enclosed by reflecting water pool and glass portals.",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80",
      location: "Udaipur"
    },
    {
      title: "The Marble Residence",
      type: "Full Turnkey Estate",
      desc: "A 14,000 sq.ft palatial estate combining Rajput arches with Milanese minimalism.",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
      location: "London"
    }
  ];

  // Render 18 Cards (3 sets of 6) into #sightsTrack
  const sightsTrack = document.getElementById("sightsTrack");
  const fullSet = [...projects, ...projects, ...projects];

  fullSet.forEach((proj, idx) => {
    const card = document.createElement("article");
    card.className = "sight-card";
    card.setAttribute("data-index", idx);
    card.innerHTML = `
      <div class="sight-card-img-wrapper">
        <img src="${proj.image}" alt="${proj.title}" loading="lazy" />
        <span class="sight-type-badge">${proj.type}</span>
      </div>
      <div class="sight-card-content">
        <h3>${proj.title}</h3>
        <p>${proj.desc}</p>
        <div class="sight-card-footer">
          <span>${proj.location}</span>
          <span>Explore Residence ↗</span>
        </div>
      </div>
    `;
    sightsTrack.appendChild(card);
  });

  // --------------------------------------------------------------------------
  // 2. INFINITE CAROUSEL ENGINE
  // --------------------------------------------------------------------------
  let currentIndex = 6; // Starts at index 6 (Set 2 start)
  const totalCards = fullSet.length;
  const sightPrev = document.getElementById("sightPrev");
  const sightNext = document.getElementById("sightNext");
  const root = document.documentElement;

  function updateCarouselShift(animated = true) {
    const firstCard = sightsTrack.children[0];
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 32; // 2rem gap
    const shiftPx = -(currentIndex * (cardWidth + gap));

    if (!animated) {
      sightsTrack.style.transition = "none";
    } else {
      sightsTrack.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    }

    root.style.setProperty("--sights-shift", `${shiftPx}px`);
  }

  function handlePrev() {
    currentIndex--;
    updateCarouselShift(true);

    if (currentIndex < 3) {
      setTimeout(() => {
        currentIndex += 6;
        updateCarouselShift(false);
      }, 400);
    }
  }

  function handleNext() {
    currentIndex++;
    updateCarouselShift(true);

    if (currentIndex >= 12) {
      setTimeout(() => {
        currentIndex -= 6;
        updateCarouselShift(false);
      }, 400);
    }
  }

  sightPrev.addEventListener("click", handlePrev);
  sightNext.addEventListener("click", handleNext);

  // Initial Carousel Position
  updateCarouselShift(false);
  window.addEventListener("resize", () => updateCarouselShift(false));

  // --------------------------------------------------------------------------
  // 3. INERTIAL RAF SCROLL ENGINE & 3D RIG MATH
  // --------------------------------------------------------------------------
  const cinemaSec = document.getElementById("cinema");
  const sightsControls = document.getElementById("sightsControls");

  let currentScrollY = window.pageYOffset;
  let targetScrollY = window.pageYOffset;
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onScroll() {
    targetScrollY = window.pageYOffset;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  function tickRAF() {
    // Inertial Lerp calculation
    if (isReducedMotion) {
      currentScrollY = targetScrollY;
    } else {
      currentScrollY += (targetScrollY - currentScrollY) * 0.085;
    }

    if (cinemaSec) {
      const cinemaTop = cinemaSec.offsetTop;
      const cinemaHeight = cinemaSec.offsetHeight - window.innerHeight;
      const s = currentScrollY - cinemaTop;
      const sClamped = Math.max(0, Math.min(s, cinemaHeight));

      // Keyframe 1: 0px – 650px (Title shrink/lift & exterior zoom)
      const t1 = Math.min(1, Math.max(0, sClamped / 650));
      const titleScale = 1 - t1 * 0.4;
      const titleY = -t1 * 210;
      const titleOpacity = 1 - t1;
      const backScale = 0.76 + t1 * 0.24;
      const backY = -t1 * 30;

      const heroCopyOpacity = 1 - Math.min(1, sClamped / 400);
      const heroCopyY = -Math.min(1, sClamped / 400) * 50;

      root.style.setProperty("--title-scale", titleScale.toFixed(3));
      root.style.setProperty("--title-y", `${titleY.toFixed(1)}px`);
      root.style.setProperty("--title-opacity", titleOpacity.toFixed(3));
      root.style.setProperty("--back-scale", backScale.toFixed(3));
      root.style.setProperty("--back-y", `${backY.toFixed(1)}px`);
      root.style.setProperty("--Hero-copy-opacity", heroCopyOpacity.toFixed(3));
      root.style.setProperty("--Hero-copy-y", `${heroCopyY.toFixed(1)}px`);

      // Keyframe 2: 560px – 1620px (Splitting Entrance Portals & Living Hall reveal)
      const t2 = Math.min(1, Math.max(0, (sClamped - 560) / 1060));
      const t2Smooth = t2 * t2 * (3 - 2 * t2); // Smooth step
      const splitLeftX = -50 - t2Smooth * 46;
      const splitRightX = -50 + t2Smooth * 46;
      const splitScale = 1 + t2Smooth * 0.74;

      const hallWidth = 67.2 + t2Smooth * (105 - 67.2);
      const hallScale = 1.02 + t2Smooth * 0.33;

      root.style.setProperty("--split-left-x", `${splitLeftX.toFixed(2)}%`);
      root.style.setProperty("--split-right-x", `${splitRightX.toFixed(2)}%`);
      root.style.setProperty("--split-left-scale", splitScale.toFixed(3));
      root.style.setProperty("--split-right-scale", splitScale.toFixed(3));
      root.style.setProperty("--hall-width", `${hallWidth.toFixed(2)}vw`);
      root.style.setProperty("--hall-scale", hallScale.toFixed(3));

      // Story Panel 1 (Living Hall) Fade in & out
      let panel2Opacity = 0;
      if (sClamped >= 700 && sClamped <= 1600) {
        if (sClamped < 900) {
          panel2Opacity = (sClamped - 700) / 200;
        } else if (sClamped > 1400) {
          panel2Opacity = 1 - (sClamped - 1400) / 200;
        } else {
          panel2Opacity = 1;
        }
      }
      root.style.setProperty("--panel2-opacity", panel2Opacity.toFixed(3));
      root.style.setProperty("--panel2-y", `calc(-50% + ${(58 * (1 - panel2Opacity)).toFixed(1)}px)`);

      // Keyframe 3: 1760px – 2700px (Kitchen & Master Suite Transition)
      const t3 = Math.min(1, Math.max(0, (sClamped - 1760) / 940));
      const kitchenOpacity = t3;
      const kitchenScale = 1.06 + t3 * 0.19;
      const interiorSaturation = 1 + t3 * 0.2;
      const interiorBrightness = 1 - t3 * 0.05;

      root.style.setProperty("--kitchen-opacity", kitchenOpacity.toFixed(3));
      root.style.setProperty("--kitchen-scale", kitchenScale.toFixed(3));
      root.style.setProperty("--interior-saturation", interiorSaturation.toFixed(2));
      root.style.setProperty("--interior-brightness", interiorBrightness.toFixed(2));

      // Story Panel 2 (Master Suite & Cinema) Fade in & out
      let panel3Opacity = 0;
      if (sClamped >= 1800 && sClamped <= 2650) {
        if (sClamped < 2000) {
          panel3Opacity = (sClamped - 1800) / 200;
        } else if (sClamped > 2450) {
          panel3Opacity = 1 - (sClamped - 2450) / 200;
        } else {
          panel3Opacity = 1;
        }
      }
      root.style.setProperty("--panel3-opacity", panel3Opacity.toFixed(3));
      root.style.setProperty("--panel3-y", `calc(-50% + ${(58 * (1 - panel3Opacity)).toFixed(1)}px)`);

      // Keyframe 4: 2760px – 3560px (Projects Slider Swoops In)
      const t4 = Math.min(1, Math.max(0, (sClamped - 2760) / 800));
      const enterEase = Math.pow(1 - t4, 1.55);
      const sightsEnterX = 420 * enterEase;
      const sightsOpacity = t4;
      const sightsVisibility = sClamped > 2700 ? "visible" : "hidden";

      root.style.setProperty("--sights-enter-x", `${sightsEnterX.toFixed(1)}vw`);
      root.style.setProperty("--sights-opacity", sightsOpacity.toFixed(3));
      root.style.setProperty("--sights-visibility", sightsVisibility);

      // Keyframe 5: 3360px – 3660px (Sights Controls Ready)
      const t5 = Math.min(1, Math.max(0, (sClamped - 3360) / 300));
      root.style.setProperty("--sights-controls-opacity", t5.toFixed(3));

      if (sClamped >= 3500 && sightsControls) {
        sightsControls.classList.add("is-ready");
      } else if (sightsControls) {
        sightsControls.classList.remove("is-ready");
      }
    }

    requestAnimationFrame(tickRAF);
  }

  requestAnimationFrame(tickRAF);

  // --------------------------------------------------------------------------
  // 4. INTERACTIVE BEFORE & AFTER COMPARISON SLIDER
  // --------------------------------------------------------------------------
  const baRangeInput = document.getElementById("baRangeInput");
  const beforeLayer = document.getElementById("beforeLayer");
  const baHandle = document.getElementById("baHandle");

  if (baRangeInput && beforeLayer && baHandle) {
    baRangeInput.addEventListener("input", (e) => {
      const val = e.target.value;
      beforeLayer.style.width = `${val}%`;
      baHandle.style.left = `${val}%`;
    });
  }

  // --------------------------------------------------------------------------
  // 5. CURATED SPACES GALLERY FILTER PILLS
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll("#galleryFilters .pill-btn");
  const galleryCards = document.querySelectorAll("#spacesGallery .gallery-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filterVal = btn.getAttribute("data-filter");

      galleryCards.forEach((card) => {
        const cat = card.getAttribute("data-category");
        if (filterVal === "all" || cat === filterVal) {
          card.classList.remove("hidden");
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 6. INTERACTIVE FAQ ACCORDION
  // --------------------------------------------------------------------------
  const faqItems = document.querySelectorAll("#faqAccordion .faq-item");

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const panel = item.querySelector(".faq-panel");

    trigger.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other accordions
      faqItems.forEach((other) => {
        other.classList.remove("active");
        const otherTrigger = other.querySelector(".faq-trigger");
        const otherPanel = other.querySelector(".faq-panel");
        if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.style.maxHeight = "0";
      });

      // Toggle current accordion
      if (!isActive) {
        item.classList.add("active");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

});

// --------------------------------------------------------------------------
// 7. FORM SUBMISSION & CONFIRMATION MODAL
// --------------------------------------------------------------------------
function submitForm() {
  const modal = document.getElementById("confirmModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal() {
  const modal = document.getElementById("confirmModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

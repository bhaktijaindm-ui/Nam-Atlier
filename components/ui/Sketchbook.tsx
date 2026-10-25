"use client";

import React, { useId, useMemo } from "react";

export interface SketchbookPlate {
  src: string;
  title: string;
  subtitle?: string;
  category?: string;
}

export interface SketchbookProps {
  plates?: SketchbookPlate[];
  assetBaseUrl?: string;
  initialPlate?: number;
  className?: string;
  aspectRatio?: string;
}

export const DEFAULT_PLATES: SketchbookPlate[] = [
  {
    src: "scrapbook-images/1.png",
    title: "Villa Sanctuary — Cantilever & Massing Study",
    subtitle: "Tactile ink & wash exterior elevation exploring natural light reveals.",
    category: "CONCEPT ELEVATION 01"
  },
  {
    src: "scrapbook-images/2.png",
    title: "Palatial Facade — Classical Rajput & Italianate Portico",
    subtitle: "Symmetry, monumental columns, and deep-shaded entrance verandas.",
    category: "CONCEPT ELEVATION 02"
  },
  {
    src: "scrapbook-images/3.png",
    title: "Urban Estate — Geometric Screen & Nocturnal Illumination",
    subtitle: "Laser-cut stone jali detailing and indirect perimeter wall wash.",
    category: "CONCEPT ELEVATION 03"
  },
  {
    src: "scrapbook-images/4.png",
    title: "Sculptural Residence — Fluid Curvature & Balcony Terraces",
    subtitle: "Organic arch geometry, monolithic stucco, and integrated planters.",
    category: "CONCEPT ELEVATION 04"
  },
  {
    src: "scrapbook-images/5.png",
    title: "Grand Living Pavilion — Curvilinear Joinery & Stone Wall",
    subtitle: "Double-height interior volume with custom curved seating and bookmatched stone.",
    category: "SPATIAL INTERIOR 05"
  },
  {
    src: "scrapbook-images/6.png",
    title: "Master Suite Sanctuary — Illuminated Bedhead Niche",
    subtitle: "Bespoke mouldings, acoustic isolation, and calibrated 2700K ambient glow.",
    category: "SPATIAL INTERIOR 06"
  },
  {
    src: "scrapbook-images/7.png",
    title: "Penthouse Suite — Organic Seating & Suspended Luminescence",
    subtitle: "Sculpted low-slung sofa, floating chandeliers, and textured wall drapery.",
    category: "SPATIAL INTERIOR 07"
  }
];

export interface CreateSketchbookDocumentOptions {
  plates?: SketchbookPlate[];
  assetBaseUrl?: string;
  initialPlate?: number;
}

export function createSketchbookDocument(options: CreateSketchbookDocumentOptions = {}): string {
  const plates = options.plates && options.plates.length > 0 ? options.plates : DEFAULT_PLATES;
  const initialPlate = options.initialPlate ?? 0;
  const assetBase = options.assetBaseUrl ?? "";

  const platesJson = JSON.stringify(
    plates.map((p) => ({
      ...p,
      src: assetBase ? `${assetBase.replace(/\/$/, "")}/${p.src.replace(/^\//, "")}` : p.src
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>NAM Atelier Architectural Sketchbook</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg-dark: #080808;
      --gold: #C6AD85;
      --gold-bright: #D8C3A0;
      --border-subtle: rgba(255, 255, 255, 0.1);
      --border-gold: rgba(198, 173, 133, 0.35);
      --font-serif: 'Cormorant Garamond', Georgia, serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    html, body {
      width: 100%;
      height: 100%;
      background: var(--bg-dark);
      color: #FFFFFF;
      font-family: var(--font-sans);
      overflow-x: hidden;
      overflow-y: visible;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      user-select: none;
      -webkit-user-select: none;
    }

    .sketchbook-wrapper {
      position: relative;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      padding: 0.25rem 0.65rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      box-sizing: border-box;
    }

    /* 3D BOOK STAGE */
    .book-stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      perspective: 2400px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: none;
    }

    .book-container {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 4px;
      overflow: visible;
      transform-style: preserve-3d;
      background: transparent;
      border: none;
      box-shadow: none;
    }

    /* BASE VISIBLE SPREAD */
    .base-spread {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 6px;
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      pointer-events: none;
    }

    /* LEFT & RIGHT UNDERLAY LAYERS FOR FLIPPING REVEAL */
    .underlay-left, .underlay-right {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50%;
      height: 100%;
      background-size: 200% 100%;
      background-repeat: no-repeat;
      display: none;
    }

    .underlay-left {
      left: 0;
      background-position: left center;
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }

    .underlay-right {
      right: 0;
      background-position: right center;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
    }

    /* 3D FLIPPING LEAF */
    .flipper-leaf {
      position: absolute;
      top: 0;
      left: 50%;
      width: 50%;
      height: 100%;
      transform-origin: left center;
      transform-style: preserve-3d;
      display: none;
      z-index: 20;
      cursor: pointer;
    }

    .leaf-face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      background-size: 200% 100%;
      background-repeat: no-repeat;
      overflow: hidden;
    }

    .leaf-front {
      background-position: right center;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      transform: rotateY(0deg);
    }

    .leaf-back {
      background-position: left center;
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
      transform: rotateY(180deg);
    }

    /* REALISTIC DYNAMIC FLIP SHADOWS */
    .leaf-shadow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s linear;
    }

    .leaf-front .leaf-shadow {
      background: linear-gradient(to left, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 80%);
    }

    .leaf-back .leaf-shadow {
      background: linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 80%);
    }

    /* CENTRAL REALISTIC SPINE CREASE - REMOVED THICK BLACK STRIP */
    .book-spine-crease {
      display: none;
    }

    /* CLICK ZONES ON LEFT/RIGHT HALVES */
    .click-zone {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50%;
      z-index: 12;
      cursor: pointer;
    }
    .click-zone.left { left: 0; }
    .click-zone.right { right: 0; }

    /* CONTROLS & NAVIGATION ARROWS */
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(14, 14, 14, 0.88);
      border: 1px solid var(--border-gold);
      color: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 30;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: all 0.25s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }

    .nav-arrow:hover:not(.disabled) {
      background: var(--gold);
      color: #000000;
      border-color: var(--gold);
      transform: translateY(-50%) scale(1.08);
    }

    .nav-arrow.disabled {
      opacity: 0.25;
      cursor: not-allowed;
      border-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.3);
    }

    .nav-arrow.prev { left: -14px; }
    .nav-arrow.next { right: -14px; }

    .nav-arrow svg {
      width: 16px;
      height: 16px;
      stroke-width: 2.2;
      fill: none;
      stroke: currentColor;
    }

    /* FOOTER BAR: PLATE TITLE & COUNTER */
    .book-meta-bar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.55rem;
      padding: 0 0.2rem;
      font-size: 0.82rem;
    }

    .plate-badge-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .plate-counter-pill {
      font-family: var(--font-sans);
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 0.16rem 0.52rem;
      background: rgba(198, 173, 133, 0.12);
      border: 1px solid rgba(198, 173, 133, 0.3);
      color: var(--gold);
      border-radius: 999px;
    }

    .plate-title-text {
      font-family: var(--font-serif);
      font-size: 0.96rem;
      font-weight: 500;
      color: #F0F0F0;
      letter-spacing: 0.4px;
    }

    .hint-instruction {
      font-size: 0.68rem;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.4px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    @media (max-width: 768px) {
      .nav-arrow.prev { left: 6px; }
      .nav-arrow.next { right: 6px; }
      .nav-arrow { width: 32px; height: 32px; }
      .nav-arrow svg { width: 14px; height: 14px; }
      .book-meta-bar {
        margin-top: 0.5rem;
        flex-direction: column;
        gap: 0.3rem;
        text-align: center;
      }
      .plate-badge-group {
        flex-direction: column;
        gap: 0.25rem;
      }
      .plate-title-text {
        font-size: 0.92rem;
        line-height: 1.35;
        padding-bottom: 3px;
      }
      .hint-instruction { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .flipper-leaf {
        transition: none !important;
      }
    }
  </style>
</head>
<body>

  <div class="sketchbook-wrapper">

    <div class="book-stage" id="bookStage" role="region" aria-label="Architectural Sketchbook">
      
      <!-- Previous Button -->
      <button class="nav-arrow prev" id="prevBtn" aria-label="Previous sketch plate" title="Previous page (Left Arrow)">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <!-- Next Button -->
      <button class="nav-arrow next" id="nextBtn" aria-label="Next sketch plate" title="Next page (Right Arrow)">
        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <!-- Book Frame -->
      <div class="book-container" id="bookContainer">
        
        <!-- Base Active Spread -->
        <div class="base-spread" id="baseSpread"></div>

        <!-- Underlay Reveal Halves -->
        <div class="underlay-left" id="underlayLeft"></div>
        <div class="underlay-right" id="underlayRight"></div>

        <!-- Central Spine Crease -->
        <div class="book-spine-crease"></div>

        <!-- Interactive 3D Flipper Leaf -->
        <div class="flipper-leaf" id="flipperLeaf">
          <div class="leaf-face leaf-front" id="leafFront">
            <div class="leaf-shadow" id="frontShadow"></div>
          </div>
          <div class="leaf-face leaf-back" id="leafBack">
            <div class="leaf-shadow" id="backShadow"></div>
          </div>
        </div>

        <!-- Clickable Zones -->
        <div class="click-zone left" id="clickLeft" title="Turn page backward"></div>
        <div class="click-zone right" id="clickRight" title="Turn page forward"></div>

      </div>

    </div>

    <!-- Bottom Meta Row -->
    <div class="book-meta-bar">
      <div class="plate-badge-group">
        <span class="plate-counter-pill" id="plateCounter">Plate 01 / 07</span>
        <span class="plate-title-text" id="plateTitle">Villa Sanctuary — Cantilever &amp; Massing Study</span>
      </div>
      <div class="hint-instruction">
        <span>Click pages, use arrows, or swipe to turn</span>
      </div>
    </div>

  </div>

  <script>
    const PLATES = ${platesJson};
    let currentIndex = ${initialPlate};
    let isFlipping = false;

    const baseSpread = document.getElementById('baseSpread');
    const underlayLeft = document.getElementById('underlayLeft');
    const underlayRight = document.getElementById('underlayRight');
    const flipperLeaf = document.getElementById('flipperLeaf');
    const leafFront = document.getElementById('leafFront');
    const leafBack = document.getElementById('leafBack');
    const frontShadow = document.getElementById('frontShadow');
    const backShadow = document.getElementById('backShadow');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const plateCounter = document.getElementById('plateCounter');
    const plateTitle = document.getElementById('plateTitle');

    // Preload image plates
    PLATES.forEach((p) => {
      const img = new Image();
      img.src = p.src;
    });

    function updateSpreadView(index) {
      const p = PLATES[index];
      baseSpread.style.backgroundImage = 'url("' + p.src + '")';
      plateCounter.textContent = 'Plate ' + String(index + 1).padStart(2, '0') + ' / ' + String(PLATES.length).padStart(2, '0');
      plateTitle.textContent = p.title;

      // Update button states
      if (index === 0) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }

      if (index === PLATES.length - 1) {
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.classList.remove('disabled');
      }
    }

    // Initialize View
    updateSpreadView(currentIndex);

    function turnPage(direction, explicitTarget) {
      if (isFlipping) return;
      const targetIndex = typeof explicitTarget === 'number' ? explicitTarget : currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= PLATES.length) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        currentIndex = targetIndex;
        updateSpreadView(currentIndex);
        return;
      }

      isFlipping = true;

      const currentSrc = PLATES[currentIndex].src;
      const targetSrc = PLATES[targetIndex].src;

      if (direction === 1) {
        // FORWARD FLIP: Right page lifts and turns to the left (0deg to -180deg)
        // Underlay reveals target right half
        underlayRight.style.backgroundImage = 'url("' + targetSrc + '")';
        underlayRight.style.display = 'block';

        // Flipper Leaf setup
        flipperLeaf.style.left = '50%';
        flipperLeaf.style.transformOrigin = 'left center';
        leafFront.style.backgroundImage = 'url("' + currentSrc + '")';
        leafBack.style.backgroundImage = 'url("' + targetSrc + '")';
        
        flipperLeaf.style.display = 'block';
        flipperLeaf.style.transition = 'none';
        flipperLeaf.style.transform = 'rotateY(0deg)';
        frontShadow.style.opacity = '0';
        backShadow.style.opacity = '0.5';

        // Trigger animation
        requestAnimationFrame(() => {
          flipperLeaf.style.transition = 'transform 0.88s cubic-bezier(0.22, 1, 0.36, 1)';
          flipperLeaf.style.transform = 'rotateY(-180deg)';
          frontShadow.style.opacity = '0.4';
          backShadow.style.opacity = '0';
        });

      } else {
        // BACKWARD FLIP: Left page lifts and turns to the right (-180deg to 0deg)
        // Underlay reveals target left half
        underlayLeft.style.backgroundImage = 'url("' + targetSrc + '")';
        underlayLeft.style.display = 'block';

        // Flipper Leaf setup
        flipperLeaf.style.left = '50%';
        flipperLeaf.style.transformOrigin = 'left center';
        leafFront.style.backgroundImage = 'url("' + targetSrc + '")';
        leafBack.style.backgroundImage = 'url("' + currentSrc + '")';

        flipperLeaf.style.display = 'block';
        flipperLeaf.style.transition = 'none';
        flipperLeaf.style.transform = 'rotateY(-180deg)';
        frontShadow.style.opacity = '0.4';
        backShadow.style.opacity = '0';

        // Trigger animation
        requestAnimationFrame(() => {
          flipperLeaf.style.transition = 'transform 0.88s cubic-bezier(0.22, 1, 0.36, 1)';
          flipperLeaf.style.transform = 'rotateY(0deg)';
          frontShadow.style.opacity = '0';
          backShadow.style.opacity = '0.4';
        });
      }

      setTimeout(() => {
        currentIndex = targetIndex;
        updateSpreadView(currentIndex);
        flipperLeaf.style.display = 'none';
        underlayLeft.style.display = 'none';
        underlayRight.style.display = 'none';
        isFlipping = false;
      }, 900);
    }

    function goToPlate(targetIndex) {
      if (targetIndex < 0 || targetIndex >= PLATES.length) return;
      if (targetIndex === currentIndex) return;

      if (isFlipping) {
        currentIndex = targetIndex;
        updateSpreadView(currentIndex);
        flipperLeaf.style.display = 'none';
        underlayLeft.style.display = 'none';
        underlayRight.style.display = 'none';
        isFlipping = false;
        return;
      }

      const diff = targetIndex - currentIndex;
      if (Math.abs(diff) > 1) {
        currentIndex = targetIndex;
        updateSpreadView(currentIndex);
      } else {
        turnPage(diff > 0 ? 1 : -1, targetIndex);
      }
    }

    // Scroll listener from parent page
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'SCROLL_PLATE') {
        goToPlate(e.data.index);
      }
    });

    // Forward wheel scrolling to parent
    window.addEventListener('wheel', (e) => {
      window.parent.postMessage({ type: 'IFRAME_WHEEL', deltaY: e.deltaY }, '*');
    }, { passive: true });

    // Button Clicks
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      turnPage(-1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      turnPage(1);
    });

    // Page Halves Clicks
    document.getElementById('clickLeft').addEventListener('click', () => turnPage(-1));
    document.getElementById('clickRight').addEventListener('click', () => turnPage(1));

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') turnPage(-1);
      if (e.key === 'ArrowRight') turnPage(1);
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (touchStartX === 0) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          turnPage(1); // Swipe left -> next
        } else {
          turnPage(-1); // Swipe right -> prev
        }
      }
      touchStartX = 0;
    }, { passive: true });
  </script>
</body>
</html>`;
}

export const Sketchbook: React.FC<SketchbookProps> = ({
  plates = DEFAULT_PLATES,
  assetBaseUrl = "",
  initialPlate = 0,
  className = "",
  aspectRatio = "16 / 11.5"
}) => {
  const frameId = useId();

  const srcDocContent = useMemo(() => {
    return createSketchbookDocument({
      plates,
      assetBaseUrl,
      initialPlate
    });
  }, [plates, assetBaseUrl, initialPlate]);

  return (
    <div
      className={`sketchbook-component-container ${className}`.trim()}
      style={{
        width: "100%",
        maxWidth: "760px",
        margin: "0 auto",
        position: "relative"
      }}
    >
      <iframe
        id={frameId}
        title="NAM Atelier Architectural Sketchbook"
        srcDoc={srcDocContent}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        style={{
          width: "100%",
          aspectRatio,
          border: "none",
          display: "block",
          borderRadius: "8px",
          overflow: "hidden"
        }}
      />
    </div>
  );
};

export default Sketchbook;

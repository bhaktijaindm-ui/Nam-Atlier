"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimationSection({
  images = [],
  children,
}) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".sa-card", root);
      const floating = gsap.utils.toArray(".sa-float", root);
      const scene = root.querySelector(".sa-scene");
      const zoom = root.querySelector(".sa-zoom-image");
      const layers = gsap.utils.toArray(".sa-zoom-layer", root);
      const progress = root.querySelector(".sa-progress");

      // 1. Reveal images as they enter the viewport.
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
              start: "top 82%",
              end: "top 42%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // 2. Directional image movement tied to scrolling.
      floating.forEach((element, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const distance = 180 + (index % 3) * 40;

        gsap.fromTo(
          element,
          {
            x: direction * distance,
            y: index % 2 === 0 ? 40 : -40,
            scale: 0.88,
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

      // 3. Cinematic pinned zoom and image transitions.
      if (scene && zoom) {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: () => `+=${window.innerHeight * 2.8}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            zoom,
            { scale: 1.0 },
            { scale: 1.45, duration: 1, ease: "none" }
          );

        // Crossfade existing images in sequence.
        layers.forEach((layer, index) => {
          if (index === 0) return;

          const previous = layers[index - 1];
          const position = 0.45 + (index / layers.length) * 1.5;

          timeline
            .to(
              previous,
              { autoAlpha: 0, duration: 0.3, ease: "none" },
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

        // Scroll progress indicator.
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
                end: () => `+=${window.innerHeight * 2.8}`,
                scrub: true,
              },
            }
          );
        }
      }

      // 4. Optional parallax for elements marked sa-parallax.
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
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="sa-root" ref={rootRef}>
      {children}

      {/*
        Integrate the following class names into the actual existing
        image elements and sections.

        .sa-card       = image reveal
        .sa-float      = directional scroll movement
        .sa-parallax   = parallax movement
        .sa-scene      = pinned animation scene
        .sa-zoom-image = zoom container
        .sa-zoom-layer = individual transition image
        .sa-progress   = progress indicator
      */}
    </section>
  );
}

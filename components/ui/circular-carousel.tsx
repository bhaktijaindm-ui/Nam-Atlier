"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  tag?: string;
  image?: string;
  href?: string;
}

export interface CircularCarouselProps {
  items: CarouselItem[];
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const VISIBLE_COUNT = 5;
const RADIUS_X = 260;
const RADIUS_Y = 110;

function getItemPosition(index: number, activeIndex: number, total: number) {
  const offset = index - activeIndex;
  const half = Math.floor(VISIBLE_COUNT / 2);
  let adjustedOffset = offset;

  if (offset > half) adjustedOffset = offset - total;
  if (offset < -half) adjustedOffset = offset + total;

  if (Math.abs(adjustedOffset) > half * 2) return null;

  const angle = (adjustedOffset / VISIBLE_COUNT) * Math.PI;
  const x = Math.sin(angle) * RADIUS_X;
  const y = -Math.cos(angle) * RADIUS_Y;

  const distance = Math.abs(adjustedOffset);
  const maxDistance = half + 1;
  const scale = Math.max(0, 1 - (distance / maxDistance) * 0.28);
  const opacity = Math.max(0.3, 1 - (distance / maxDistance) * 0.65);
  const zIndex = VISIBLE_COUNT - distance;

  return { x, y, scale, opacity, zIndex, adjustedOffset };
}

export function CircularCarousel({
  items,
  activeIndex: controlledIndex,
  onActiveChange,
  autoPlay = true,
  autoPlayInterval = 4000,
  className,
}: CircularCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = controlledIndex ?? internalIndex;
  const total = items.length;

  const goTo = useCallback(
    (index: number) => {
      const newIndex = ((index % total) + total) % total;
      if (controlledIndex === undefined) {
        setInternalIndex(newIndex);
      }
      onActiveChange?.(newIndex);
    },
    [total, controlledIndex, onActiveChange],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!autoPlay || isHovered || isFocused) return;
    intervalRef.current = setInterval(next, autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, autoPlayInterval, isHovered, isFocused, next]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const el = containerRef.current;
    el?.addEventListener("keydown", handler);
    return () => el?.removeEventListener("keydown", handler);
  }, [next, prev]);

  const activeItem = items[activeIndex];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="NAM Atelier Architectural Services Carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-10 outline-none w-full max-w-6xl mx-auto py-12 select-none",
        className,
      )}
    >
      {/* 3D Arc Track */}
      <div className="relative h-[420px] w-full max-w-4xl flex items-center justify-center overflow-visible">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = getItemPosition(i, activeIndex, total);
            if (!pos) return null;

            const isActive = i === activeIndex;

            return (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: pos.scale,
                  opacity: pos.opacity,
                  zIndex: pos.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => goTo(i)}
                aria-label={item.title}
                aria-selected={isActive}
                role="option"
                className={cn(
                  "absolute left-1/2 top-1/2 flex w-[280px] sm:w-[320px] -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-md transition-all duration-300",
                  isActive
                    ? "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] border-[#C6AD85]/50 ring-1 ring-[#C6AD85]/30"
                    : "shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] opacity-70 hover:opacity-100",
                )}
                style={{ transformOrigin: "center center" }}
              >
                {/* Media Section */}
                {item.image && (
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/40">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                    {item.tag && (
                      <span className="absolute top-3 left-3 rounded-full bg-black/60 border border-[#C6AD85]/40 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#C6AD85] uppercase backdrop-blur-md">
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}

                {/* Content Section */}
                <div className="w-full p-4 flex flex-col justify-between gap-2">
                  <div>
                    <h3
                      className={cn(
                        "font-medium tracking-wide uppercase transition-colors duration-300",
                        isActive
                          ? "text-[#F3EEE6] text-base"
                          : "text-[#F3EEE6]/80 text-sm",
                      )}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 line-clamp-2 text-xs leading-relaxed transition-colors duration-300 font-light",
                        isActive ? "text-[#A89F92]" : "text-[#A89F92]/60",
                      )}
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {item.description}
                    </p>
                  </div>

                  {item.href && (
                    <a
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C6AD85] hover:text-white transition-colors"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      <span>Explore Service</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {/* Center Backing Counter */}
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -z-10"
        >
          <span
            className="text-7xl sm:text-8xl font-extralight tracking-widest text-white/5 select-none"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span
            className="text-xs uppercase tracking-widest text-[#C6AD85]/40 -mt-2"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            of {String(total).padStart(2, "0")} Disciplines
          </span>
        </motion.div>
      </div>

      {/* Controls & Pagination */}
      <div className="flex items-center gap-5 mt-4 z-20">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={prev}
          aria-label="Previous service"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-[#F3EEE6] backdrop-blur-md transition-all hover:border-[#C6AD85] hover:text-[#C6AD85] hover:shadow-[0_0_16px_rgba(198,173,133,0.3)]"
        >
          <ChevronLeft className="size-5" />
        </motion.button>

        {/* Dot Indicators */}
        <div className="flex items-center gap-2" role="tablist">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIndex}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-7 bg-[#C6AD85] shadow-[0_0_8px_rgba(198,173,133,0.6)]"
                  : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
              aria-label={`Go to service ${i + 1}`}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={next}
          aria-label="Next service"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-[#F3EEE6] backdrop-blur-md transition-all hover:border-[#C6AD85] hover:text-[#C6AD85] hover:shadow-[0_0_16px_rgba(198,173,133,0.3)]"
        >
          <ChevronRight className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default CircularCarousel;

"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, X } from "lucide-react";

// ===== Types and Interfaces =====
export interface iTestimonial {
  name: string;
  designation: string;
  description: string;
  profileImage: string;
  backgroundImage?: string;
}

interface iCarouselProps {
  items: React.ReactElement<{
    testimonial: iTestimonial;
    index: number;
    layout?: boolean;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
}

const defaultTestimonials: iTestimonial[] = [
  {
    name: "Priya Sharma",
    designation: "Data Scientist at QuantumLeap & Villa Owner",
    description: "This platform revolutionized our spatial planning and data analysis process. The 3D render speed and structural accuracy are unparalleled. A must-have for any high-end architectural project.",
    profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Marcus Johnson",
    designation: "Head of Operations at Synergy Corp",
    description: "The user interface is incredibly intuitive, which made reviewing 3D VR walkthroughs for my team a breeze. We finalized civil plans in hours, not days.",
    profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Isabella Rossi",
    designation: "Client Success Manager at Horizon",
    description: "Customer support and turnkey civil execution are top-notch. Udhay & Mudita are responsive, knowledgeable, and genuinely invested in building your architectural dream home.",
    profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Kenji Tanaka",
    designation: "Software Engineer at CodeCrafters",
    description: "I'm impressed by the constant stream of updates, German Blum hardware sourcing, and custom acoustic cinema isolation. The development team is clearly passionate.",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Fatima Al-Jamil",
    designation: "CFO at Apex Financial & Estate Owner",
    description: "The ROI on our 14,000 sq.ft palatial estate was immediate. It streamlined our civil workflows so effectively that project delivery times were cut by nearly 30%.",
    profileImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Rajiv & Ananya Kapoor",
    designation: "The Model Town Villa • Ludhiana",
    description: "NAM Atelier transformed our 5,000 sq.ft bare brick shell into a breathtaking European-inspired sanctuary. Their 3D renders were 100% identical to the final handed-over villa!",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Siddharth Malhotra",
    designation: "Executive Penthouse • Amritsar",
    description: "The Dolby Atmos acoustic cinema lounge engineered by Udhay & Mudita is the highlight of our home. Zero vibration leakage and supreme acoustic clarity.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
];

// ===== Custom Hooks =====
const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

// ===== Components =====
export const Carousel = ({ items, initialScroll = 0 }: iCarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 280 : 384;
      const gap = isMobile() ? 16 : 24;
      const scrollPosition = (cardWidth + gap) * index;
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  return (
    <div className="relative w-full mt-6">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-6"
        ref={carouselRef}
        onScroll={checkScrollability}
      >
        <div className="flex flex-row justify-start gap-6 pl-4 max-w-7xl mx-auto">
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.15 * index,
                  ease: "easeOut",
                },
              }}
              key={`card-${index}`}
              className="flex-none rounded-3xl"
            >
              {React.cloneElement(item, {
                onCardClose: () => handleCardClose(index),
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pr-4 max-w-7xl mx-auto">
        <button
          className="relative z-40 h-11 w-11 rounded-full bg-[#4b3f33] flex items-center justify-center disabled:opacity-40 hover:bg-[#382f26] transition-colors duration-200 shadow-md cursor-pointer"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
          aria-label="Scroll Left"
        >
          <ArrowLeft className="h-5 w-5 text-[#f2f0eb]" />
        </button>
        <button
          className="relative z-40 h-11 w-11 rounded-full bg-[#4b3f33] flex items-center justify-center disabled:opacity-40 hover:bg-[#382f26] transition-colors duration-200 shadow-md cursor-pointer"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll Right"
        >
          <ArrowRight className="h-5 w-5 text-[#f2f0eb]" />
        </button>
      </div>
    </div>
  );
};

export const TestimonialCard = ({
  testimonial,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
}: {
  testimonial: iTestimonial;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/60 backdrop-blur-md h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              ref={containerRef}
              className="max-w-4xl w-full bg-gradient-to-b from-[#f2f0eb] to-[#fff9eb] z-[60] p-6 md:p-12 rounded-3xl relative shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button
                className="sticky top-0 h-9 w-9 right-0 ml-auto rounded-full flex items-center justify-center bg-[#4b3f33] text-white hover:bg-[#382f26] transition-colors cursor-pointer"
                onClick={handleCollapse}
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              <p className="px-0 md:px-12 text-[rgba(31,27,29,0.7)] text-base md:text-lg font-light underline underline-offset-8">
                {testimonial.designation}
              </p>
              <p className="px-0 md:px-12 text-2xl md:text-4xl font-serif italic text-[rgba(31,27,29,0.85)] mt-3 lowercase">
                {testimonial.name}
              </p>
              <div className="py-6 text-[rgba(31,27,29,0.75)] px-0 md:px-12 text-xl md:text-2xl lowercase font-light font-serif leading-relaxed tracking-wide flex flex-col gap-4">
                <Quote className="h-8 w-8 text-[#4b3f33] opacity-60" />
                <span>"{testimonial.description}"</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={handleExpand}
        className="text-left cursor-pointer focus:outline-none"
        whileHover={{
          rotateX: 2,
          rotateY: 2,
          rotate: 2,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <div className="rounded-3xl bg-gradient-to-b from-[#f2f0eb] to-[#fff9eb] h-[480px] md:h-[530px] w-72 md:w-96 overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-lg border border-[rgba(30,30,30,0.08)] p-6">
          <div className="absolute opacity-20 inset-0 pointer-events-none">
            <img
              className="block w-full h-full object-cover object-center"
              src={backgroundImage}
              alt="Texture layer"
            />
          </div>
          <ProfileImage src={testimonial.profileImage} alt={testimonial.name} />
          <p className="text-[rgba(31,27,29,0.75)] text-lg md:text-xl font-serif italic text-center [text-wrap:balance] mt-6 lowercase px-2 leading-snug">
            "{testimonial.description.length > 95
              ? `${testimonial.description.slice(0, 95)}...`
              : testimonial.description}"
          </p>
          <p className="text-[rgba(31,27,29,0.85)] text-xl md:text-2xl font-serif italic text-center mt-4 lowercase">
            {testimonial.name}.
          </p>
          <p className="text-[rgba(31,27,29,0.65)] text-sm md:text-base font-serif italic text-center mt-1 lowercase underline underline-offset-8 decoration-1">
            {testimonial.designation.length > 32
              ? `${testimonial.designation.slice(0, 32)}...`
              : testimonial.designation}
          </p>
        </div>
      </motion.button>
    </>
  );
};

export const ProfileImage = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <div className="w-[110px] h-[110px] md:w-[140px] md:h-[140px] opacity-90 overflow-hidden rounded-[1000px] border-[3px] border-solid border-[rgba(59,59,59,0.6)] aspect-square flex-none relative shadow-md">
      <img
        className={`transition duration-300 absolute inset-0 w-full h-full object-cover saturate-[0.3] sepia-[0.4] ${
          isLoading ? "blur-sm" : "blur-0"
        } ${className}`}
        onLoad={() => setLoading(false)}
        src={src}
        alt={alt || "Profile image"}
      />
    </div>
  );
};

// Default Section Component
export const AnimatedTestimonialsSection = () => {
  const items = defaultTestimonials.map((t, index) => (
    <TestimonialCard
      key={t.name}
      testimonial={t}
      index={index}
      onCardClose={() => {}}
    />
  ));

  return (
    <section className="relative w-full py-16 bg-[#F4EFEA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#E38F56]">
          CLIENT ENDORSEMENTS
        </span>
        <h2 className="text-3xl md:text-5xl font-serif text-[#1E1E1E] mt-2 mb-3">
          Words from Our Homeowners &amp; Partners
        </h2>
        <p className="text-base text-[#4A4C48] max-w-2xl mx-auto">
          What leaders and villa owners say about our 3D spatial design, speed, and turnkey execution.
        </p>
      </div>
      <Carousel items={items} />
    </section>
  );
};

export default AnimatedTestimonialsSection;

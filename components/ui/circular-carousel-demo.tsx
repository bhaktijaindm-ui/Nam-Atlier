"use client";

import { CircularCarousel } from "@/components/ui/circular-carousel";

const interiorServices = [
  {
    id: "1",
    tag: "01 · Architecture",
    title: "Architectural Planning & Facades",
    description: "Parametric monolithic stone facades, cantilever geometries, and private estate planning.",
    image: "/images/services-carousel/01-facades.webp",
    href: "/services/architectural-design",
  },
  {
    id: "2",
    tag: "02 · Interiors",
    title: "Luxury Interior Architecture",
    description: "Double-height living spaces, bookmatched Roman travertine, and fluted walnut panelling.",
    image: "/images/services-carousel/02-interiors.webp",
    href: "/services/interior-design",
  },
  {
    id: "3",
    tag: "03 · Civil Engineering",
    title: "Turnkey Civil Execution",
    description: "Zero-tolerance laser levelling, high-density RCC framing, and German MEP contracting.",
    image: "/images/services-carousel/03-civil.webp",
    href: "/services/turnkey-civil-execution",
  },
  {
    id: "4",
    tag: "04 · Acoustic Theatres",
    title: "Private Cinema Architecture",
    description: "Room-within-a-room acoustic decoupling, tuned fabric bass traps, and Dolby Atmos mastering.",
    image: "/images/services-carousel/04-theatres.webp",
    href: "/services/acoustic-theatre-design",
  },
  {
    id: "5",
    tag: "05 · Culinary",
    title: "Chef's Kitchen & Dining Design",
    description: "Seamless Calacatta waterfall islands, motorized concealed joinery, and Miele integration.",
    image: "/images/services-carousel/05-kitchens.webp",
    href: "/services/kitchen-dining",
  },
  {
    id: "6",
    tag: "06 · Sanctuaries",
    title: "Master Suites & Private Spas",
    description: "Circadian wellness illumination, acoustic upholstered walls, and rain shower portals.",
    image: "/images/services-carousel/06-suites.webp",
    href: "/services/master-suites",
  },
  {
    id: "7",
    tag: "07 · Landscapes",
    title: "Terraces & Outdoor Living",
    description: "Pergola outdoor kitchens, biophilic reflecting pools, and weather-treated teak lounges.",
    image: "/images/services-carousel/07-outdoors.webp",
    href: "/services/outdoor-living",
  },
];

export default function CircularCarouselDemo() {
  return (
    <div className="flex min-h-[580px] w-full items-center justify-center bg-[#0B0B0B] p-6 sm:p-12">
      <CircularCarousel items={interiorServices} />
    </div>
  );
}

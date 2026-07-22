import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/shared/SectionHeading";

import type { GalleryItem } from "@/types";

interface GalleryPreviewProps {
  images: GalleryItem[];
}

export function GalleryPreview({ images }: GalleryPreviewProps) {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading title="Gallery" subtitle="Moments from Umrah journeys and travel experiences" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
          {images.slice(0, 6).map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-navy/0 transition-colors group-hover:bg-navy/30" />
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/gallery/"
            className={cn(buttonVariants({ variant: "outline" }), "border-navy text-navy hover:bg-navy hover:text-white")}
          >
            View Full Gallery
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

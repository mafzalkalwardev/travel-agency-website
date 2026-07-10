import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { PageHeroMotion } from "@/components/motion/PageHeroMotion";
import { assetPath } from "@/lib/base-path";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  badge?: string;
  cta?: { label: string; href: string };
  showAnimatedRoute?: boolean;
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  backgroundImage = "/assets/flyers/flyer-2.jpeg",
  backgroundVideo,
  badge,
  cta,
  showAnimatedRoute = true,
  children,
}: PageHeroProps) {
  return (
    <section className="relative min-h-[42vh] overflow-hidden bg-navy md:min-h-[48vh]">
      <div className="absolute inset-0">
        <Image
          src={assetPath(backgroundImage)}
          alt=""
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-transparent to-navy/40" />
        {backgroundVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={assetPath(backgroundImage)}
            className="absolute inset-0 hidden h-full w-full object-cover opacity-35 mix-blend-overlay md:block"
          >
            <source src={assetPath(backgroundVideo)} type="video/mp4" />
          </video>
        )}
        <FloatingAircraftLayer density="low" />
        {showAnimatedRoute && (
          <AnimatedFlightPath variant="section" className="bottom-0 h-28 opacity-50" />
        )}
      </div>
      <div className="container-wide relative z-10 flex min-h-[42vh] flex-col justify-center py-16 md:min-h-[48vh] md:py-20">
        <PageHeroMotion badge={badge} title={title} subtitle={subtitle}>
          {cta && (
            <Link
              href={cta.href}
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "mt-8 inline-flex w-fit")}
            >
              {cta.label}
            </Link>
          )}
          {children}
        </PageHeroMotion>
      </div>
    </section>
  );
}

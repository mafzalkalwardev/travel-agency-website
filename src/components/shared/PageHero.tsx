import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
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
  badge,
  cta,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Image
          src={assetPath(backgroundImage)}
          alt=""
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/80 to-navy/65" />
      </div>
      <div className="container-wide relative z-10 py-14 md:py-16">
        {badge && (
          <p className="mb-3 text-sm font-medium text-gold-light">{badge}</p>
        )}
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-base text-white/70">{subtitle}</p>
        )}
        {cta && (
          <Link
            href={cta.href}
            className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "mt-6 inline-flex h-11")}
          >
            {cta.label}
          </Link>
        )}
        {children}
      </div>
    </section>
  );
}

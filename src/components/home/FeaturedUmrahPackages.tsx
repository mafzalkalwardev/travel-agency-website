import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UmrahPackageCard } from "@/components/cards/UmrahPackageCard";
import { MotionSection } from "@/components/motion/MotionSection";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { TravelPackage } from "@/types";

interface FeaturedUmrahPackagesProps {
  packages: TravelPackage[];
}

export function FeaturedUmrahPackages({ packages }: FeaturedUmrahPackagesProps) {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <MotionSection>
          <SectionHeading title="Featured Umrah Packages" subtitle="Economy to premium — flights, hotels, visa and ziyarat included" />
        </MotionSection>
        <MotionStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <MotionStaggerItem key={pkg.id}>
              <UmrahPackageCard pkg={pkg} />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <MotionSection delay={0.15} className="mt-10 text-center">
          <Link href="/umrah-packages/" className={cn(buttonVariants({ size: "lg" }), "bg-navy text-white hover:bg-navy-light")}>
            View All Umrah Packages <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </MotionSection>
      </div>
    </section>
  );
}

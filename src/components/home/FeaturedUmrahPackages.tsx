import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UmrahPackageCard } from "@/components/cards/UmrahPackageCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { TravelPackage } from "@/types";

interface FeaturedUmrahPackagesProps {
  packages: TravelPackage[];
}

export function FeaturedUmrahPackages({ packages }: FeaturedUmrahPackagesProps) {
  if (packages.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading title="Umrah Packages" subtitle="Flights, hotels, visa & ziyarat included" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <UmrahPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/umrah-packages/"
            className={cn(buttonVariants({ variant: "outlineDark", size: "lg" }), "h-11 px-6")}
          >
            All Umrah Packages <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

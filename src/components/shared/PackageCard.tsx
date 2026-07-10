"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { SafeImage } from "@/components/shared/SafeImage";
import { FALLBACK_IMAGES } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/ticket-filters";
import type { TravelPackage } from "@/types";

interface PackageCardProps {
  pkg: TravelPackage;
  bookLabel?: string;
}

export function PackageCard({ pkg, bookLabel = "Book Request" }: PackageCardProps) {
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <>
      <Card className="card-premium group overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-navy-light">
          <SafeImage
            src={pkg.image}
            fallbackSrc={pkg.type === "umrah" ? FALLBACK_IMAGES.umrah : FALLBACK_IMAGES.tour}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
          {pkg.featured && (
            <Badge className="absolute left-3 top-3 bg-gold text-navy">Featured</Badge>
          )}
          {pkg.hotelStars && (
            <div className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-navy/80 px-2 py-1 text-xs text-gold">
              <Star className="h-3 w-3 fill-gold" />
              {pkg.hotelStars} Star
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-heading text-lg font-semibold leading-snug text-navy">{pkg.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {pkg.duration}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold text-gold">
            {formatPrice(pkg.price, pkg.currency)}
          </p>
          <ul className="space-y-1">
            {pkg.highlights.slice(0, 3).map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {h}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="gap-2">
          <Link
            href={pkg.type === "umrah" ? "/umrah-packages/" : "/tour-packages/"}
            className={cn(buttonVariants({ variant: "outlineDark" }), "flex-1")}
          >
            Details
          </Link>
          <Button variant="primaryGold" className="flex-1" onClick={() => setBookOpen(true)}>
            {bookLabel}
          </Button>
        </CardFooter>
      </Card>

      <BookRequestSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        productType={pkg.type === "umrah" ? "umrah" : "tour"}
        productTitle={pkg.title}
        quotedPrice={pkg.price}
        currency={pkg.currency}
        umrahPackageId={pkg.type === "umrah" ? pkg.id : undefined}
        tourPackageId={pkg.type === "tour" ? pkg.id : undefined}
        externalProductId={pkg.packageCode}
        sourcePage={pkg.type === "umrah" ? "/umrah-packages/" : "/tour-packages/"}
      />
    </>
  );
}

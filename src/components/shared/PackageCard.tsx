"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { SafeImage } from "@/components/shared/SafeImage";
import { FALLBACK_IMAGES } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/ticket-filters";
import { SITE } from "@/lib/constants";
import type { TravelPackage } from "@/types";

interface PackageCardProps {
  pkg: TravelPackage;
  bookLabel?: string;
}

export function PackageCard({ pkg, bookLabel = "Book" }: PackageCardProps) {
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <>
      <Card className="card-premium overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-navy-light">
          <SafeImage
            src={pkg.image}
            fallbackSrc={pkg.type === "umrah" ? FALLBACK_IMAGES.umrah : FALLBACK_IMAGES.tour}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <CardHeader className="pb-1 pt-4">
          <h3 className="text-base font-semibold text-navy">{pkg.title}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {pkg.duration}
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-xl font-bold text-gold">{formatPrice(pkg.price, pkg.currency)}</p>
        </CardContent>
        <CardFooter className="gap-2 pt-0">
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outlineDark", size: "sm" }), "flex-1")}
          >
            WhatsApp
          </a>
          <Button variant="primaryGold" size="sm" className="flex-1" onClick={() => setBookOpen(true)}>
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

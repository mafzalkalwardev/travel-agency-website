"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookRequestSheet } from "@/components/booking/BookRequestSheet";
import { SafeImage } from "@/components/shared/SafeImage";
import { FALLBACK_IMAGES } from "@/lib/image-utils";
import { formatPrice } from "@/lib/ticket-filters";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TravelPackage } from "@/types";

interface UmrahPackageCardProps {
  pkg: TravelPackage;
}

export function UmrahPackageCard({ pkg }: UmrahPackageCardProps) {
  const [bookOpen, setBookOpen] = useState(false);

  return (
    <>
      <Card className="card-premium group h-full overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-navy-light">
          <SafeImage
            src={pkg.image}
            fallbackSrc={FALLBACK_IMAGES.umrah}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          {pkg.category && (
            <Badge className="absolute right-3 top-3 bg-gold text-navy capitalize">{pkg.category}</Badge>
          )}
        </div>
        <CardHeader className="pb-1 pt-4">
          <h3 className="text-base font-semibold text-navy">{pkg.title}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {pkg.duration}
            {pkg.departureCity && ` · From ${pkg.departureCity}`}
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-xl font-bold text-gold">{formatPrice(pkg.price, pkg.currency)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {pkg.visa && <Badge variant="outline" className="text-xs">Visa</Badge>}
            {pkg.transport && <Badge variant="outline" className="text-xs">Transport</Badge>}
            {pkg.ziyarat && <Badge variant="outline" className="text-xs">Ziyarat</Badge>}
          </div>
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
            Book
          </Button>
        </CardFooter>
      </Card>

      <BookRequestSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        productType="umrah"
        productTitle={pkg.title}
        quotedPrice={pkg.price}
        currency={pkg.currency}
        umrahPackageId={pkg.id}
        externalProductId={pkg.packageCode}
        sourcePage="/umrah-packages/"
      />
    </>
  );
}

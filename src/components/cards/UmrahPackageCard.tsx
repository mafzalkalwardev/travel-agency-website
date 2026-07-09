"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
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
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
      <Card className="card-premium group h-full overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-navy-light">
          <SafeImage
            src={pkg.image}
            fallbackSrc={FALLBACK_IMAGES.umrah}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {pkg.packageCode && (
            <Badge className="absolute left-3 top-3 bg-navy/90 text-gold">{pkg.packageCode}</Badge>
          )}
          {pkg.category && (
            <Badge className="absolute right-3 top-3 bg-gold text-navy capitalize">{pkg.category}</Badge>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-heading text-lg font-semibold text-navy">{pkg.title}</h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{pkg.duration}</span>
            {pkg.departureCity && <span>From {pkg.departureCity}</span>}
            {pkg.seatsLeft !== undefined && (
              <span className="flex items-center gap-1 text-brand-red"><Users className="h-3 w-3" />{pkg.seatsLeft} seats left</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-2xl font-bold text-gold">{formatPrice(pkg.price, pkg.currency)}</p>
          <div className="grid gap-1 text-muted-foreground">
            {pkg.airline && <p><strong className="text-navy">Airline:</strong> {pkg.airline}</p>}
            {pkg.hotelMakkah && <p><strong className="text-navy">Makkah:</strong> {pkg.hotelMakkah}</p>}
            {pkg.hotelMadinah && <p><strong className="text-navy">Madinah:</strong> {pkg.hotelMadinah}</p>}
            {pkg.distanceFromHaram && <p><strong className="text-navy">Haram:</strong> {pkg.distanceFromHaram}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pkg.visa && <Badge variant="outline" className="text-xs">Visa</Badge>}
            {pkg.transport && <Badge variant="outline" className="text-xs">Transport</Badge>}
            {pkg.ziyarat && <Badge variant="outline" className="text-xs">Ziyarat</Badge>}
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outlineDark", size: "default" }), "flex-1")}
          >
            WhatsApp
          </a>
          <Button variant="primaryGold" size="default" className="flex-1" onClick={() => setBookOpen(true)}>
            Book Request
          </Button>
        </CardFooter>
      </Card>
      </motion.div>

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

"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export function ContactCTA() {
  return (
    <section className="section-padding bg-navy">
      <div className="container-wide text-center">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">Ready to travel?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/65 md:text-base">
          Message us on WhatsApp or visit our Peshawar & Islamabad offices.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "h-11 px-6")}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat on WhatsApp
          </a>
          <Link
            href="/contact/"
            className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }), "h-11 px-6")}
          >
            Contact & Directions
          </Link>
        </div>
      </div>
    </section>
  );
}

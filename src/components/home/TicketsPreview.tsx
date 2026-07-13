import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { GsapStagger, GsapStaggerItem } from "@/components/motion/GsapStagger";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types";

interface TicketsPreviewProps {
  tickets: Ticket[];
}

export function TicketsPreview({ tickets }: TicketsPreviewProps) {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <GsapReveal>
          <SectionHeading
            title="Available Group Tickets"
            subtitle="Browse live group fares and request a booking"
          />
        </GsapReveal>
        <GsapStagger className="mx-auto max-w-6xl space-y-3" stagger={0.08}>
          {tickets.slice(0, 4).map((ticket) => (
            <GsapStaggerItem key={ticket.id}>
              <TicketCard ticket={ticket} />
            </GsapStaggerItem>
          ))}
        </GsapStagger>
        <GsapReveal delay={0.1} className="mt-10 text-center">
          <Link
            href="/available-tickets/"
            className={cn(buttonVariants({ size: "lg" }), "bg-gold text-navy hover:bg-gold-light")}
          >
            View All Available Tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </GsapReveal>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types";

interface TicketsPreviewProps {
  tickets: Ticket[];
}

export function TicketsPreview({ tickets }: TicketsPreviewProps) {
  if (tickets.length === 0) return null;

  return (
    <section className="section-padding bg-light-bg">
      <div className="container-wide">
        <SectionHeading
          title="Available Group Tickets"
          subtitle="Live fares — book directly on WhatsApp"
        />
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} compact />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/available-tickets/"
            className={cn(buttonVariants({ variant: "navy", size: "lg" }), "h-11 px-6")}
          >
            View All Tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

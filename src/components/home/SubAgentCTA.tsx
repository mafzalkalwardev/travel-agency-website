import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MotionSection } from "@/components/motion/MotionSection";
import { cn } from "@/lib/utils";

export function SubAgentCTA() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <MotionSection className="relative isolate overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-navy via-[#082a50] to-royal px-7 py-12 text-white shadow-2xl shadow-navy/20 sm:px-12 lg:px-16 lg:py-16">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-gold/20 bg-gold/10 blur-sm" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-royal/30 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-light">
                <UserPlus className="h-4 w-4" /> Partner with Al Qibla
              </span>
              <h2 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl">Become an Al Qibla Sub-Agent</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Grow your travel business with trusted support, competitive group inventory and a professional booking platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold" /> Verified partner access</span>
                <span className="inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-gold" /> Dedicated team support</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/account/signup/?next=/available-tickets/"
                className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "h-13 min-w-56 px-7")}
              >
                Become a Sub-Agent <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/account/login/?next=/available-tickets/"
                className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }), "h-12 min-w-56 px-7")}
              >
                Agent Sign In
              </Link>
            </div>
          </div>
        </MotionSection>
      </div>
    </section>
  );
}

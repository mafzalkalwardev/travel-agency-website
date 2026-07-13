import {
  BadgeCheck,
  Headphones,
  RefreshCcw,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { GsapStagger, GsapStaggerItem } from "@/components/motion/GsapStagger";

const reasons: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: BadgeCheck,
    title: "Registered travel expertise",
    text: "IATA-verified agent support and Department of Tourist Services registration for accountable travel handling.",
  },
  {
    icon: RefreshCcw,
    title: "Live group inventory",
    text: "Search synchronized group routes with current travel dates, available seats and published fares.",
  },
  {
    icon: UserCheck,
    title: "Approval-controlled booking",
    text: "Every customer and sub-agent profile is reviewed by an administrator before booking access is enabled.",
  },
  {
    icon: Headphones,
    title: "Support throughout the journey",
    text: "Office, phone and WhatsApp assistance for booking coordination, documentation and travel follow-up.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding relative overflow-hidden bg-light-bg text-navy">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(var(--navy)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container-wide relative">
        <GsapReveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-gold shadow-sm">
            Built for professionals
          </span>
          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight md:text-5xl">
            Why agents choose Al Qibla
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Reliable operations, live inventory and responsive support give travel professionals the confidence to serve every client well.
          </p>
        </GsapReveal>

        <GsapStagger className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map((reason) => (
            <GsapStaggerItem key={reason.title}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-border bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                  <reason.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 font-heading text-lg font-semibold text-navy">{reason.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{reason.text}</p>
              </article>
            </GsapStaggerItem>
          ))}
        </GsapStagger>

        <GsapReveal
          delay={0.1}
          className="mt-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/5 px-6 py-5 text-center sm:flex-row sm:text-left"
        >
          <p className="font-heading text-lg font-semibold text-navy">A dependable partner behind every booking.</p>
          <p className="text-sm font-medium text-gold">Verified service · Controlled access · Human support</p>
        </GsapReveal>
      </div>
    </section>
  );
}

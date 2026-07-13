import {
  BadgeCheck,
  Headphones,
  RefreshCcw,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { MotionSection } from "@/components/motion/MotionSection";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";

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
    <section className="section-padding relative overflow-hidden bg-[#f7f1e7] text-navy">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c68b43]/60 to-transparent" />
      <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-[#d8a85f]/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#7d9475]/15 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0a2342_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container-wide relative">
        <MotionSection className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-[#c68b43]/25 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#9a642c] shadow-sm">
            Built for professionals
          </span>
          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight md:text-5xl">
            Why agents choose Al Qibla
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Reliable operations, live inventory and responsive support give travel professionals the confidence to serve every client well.
          </p>
        </MotionSection>

        <MotionStagger className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map((reason, index) => (
            <MotionStaggerItem key={reason.title}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-[#dccdb8] bg-white/80 p-7 shadow-[0_18px_50px_rgba(74,51,25,0.07)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#c89b60] hover:shadow-[0_24px_60px_rgba(74,51,25,0.13)]">
                <div className={`absolute inset-x-0 top-0 h-1 ${["bg-[#c4774e]", "bg-[#4f8b79]", "bg-[#c79a3b]", "bg-[#806a91]"][index]}`} />
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${["bg-[#f4e3d8] text-[#a95735]", "bg-[#dcebe5] text-[#31715f]", "bg-[#f6e9c8] text-[#9a6b15]", "bg-[#e9e2ed] text-[#6c547d]"][index]}`}>
                  <reason.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 font-heading text-lg font-semibold text-navy">{reason.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{reason.text}</p>
              </article>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <MotionSection className="mt-7 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#d8c4a7] bg-[#efe3cf]/65 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-heading text-lg font-semibold text-navy">A dependable partner behind every booking.</p>
          <p className="text-sm font-medium text-[#78572f]">Verified service · Controlled access · Human support</p>
        </MotionSection>
      </div>
    </section>
  );
}

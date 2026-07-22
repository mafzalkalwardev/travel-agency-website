import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Portal Access",
  description: "Secure sub-agent access and live group inventory for Al Qibla Air Services.",
  path: "/portal/",
});

const entries = [
  {
    icon: Briefcase,
    eyebrow: "Sub-agents",
    title: "Sub-agent account",
    text: "Sign in to manage your company profile, approval status, and booking requests in one workspace.",
    href: "/account/login/",
    action: "Enter agent portal",
    accent: "bg-[#dcebe5] text-[#31715f]",
  },
  {
    icon: Plane,
    eyebrow: "Current availability",
    title: "Live Inventory",
    text: "Explore synchronized group fares, travel dates and seats currently available to request.",
    href: "/available-tickets/",
    action: "Browse available flights",
    accent: "bg-[#f6e9c8] text-[#9a6b15]",
  },
] as const;

export default function PortalPage() {
  return (
    <main className="relative isolate min-h-[82vh] overflow-hidden bg-[#f4efe7] py-16 sm:py-20">
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#0a2342_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#66897c]/15 blur-3xl" />

      <div className="container-wide relative">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#071d38] px-7 py-12 text-white shadow-[0_30px_90px_rgba(7,29,56,.2)] sm:px-12 lg:px-16 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(214,168,79,.2),transparent_25%),linear-gradient(135deg,transparent_45%,rgba(33,91,105,.45))]" />
          <AnimatedFlightPath variant="section" className="bottom-0 top-auto h-28 opacity-70" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-gold-light">
              <Sparkles className="h-4 w-4" /> Secure B2B access
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your agency workspace, ready when you are.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
              Sign in to manage company bookings, or browse live group inventory built for travel agents.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {entries.map((entry) => (
            <article
              key={entry.title}
              className="group relative overflow-hidden rounded-3xl border border-white bg-white/85 p-7 shadow-[0_18px_55px_rgba(25,45,65,.09)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_70px_rgba(25,45,65,.14)] sm:p-8"
            >
              <div className={`flex h-13 w-13 items-center justify-center rounded-2xl ${entry.accent}`}>
                <entry.icon className="h-6 w-6" />
              </div>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[.2em] text-[#a66d2f]">{entry.eyebrow}</p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-navy">{entry.title}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{entry.text}</p>
              <Link
                href={entry.href}
                className="mt-7 inline-flex items-center gap-2 font-bold text-navy transition group-hover:text-[#a66d2f]"
              >
                {entry.action}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#d8c7ad] bg-[#eee1ce]/70 px-6 py-5 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <ShieldCheck className="h-5 w-5 text-[#8c6636]" /> New agency? Register with your full company details.
          </p>
          <Link href="/account/signup/" className="inline-flex items-center gap-2 font-bold text-[#8c5d28]">
            Become a sub-agent <BadgeCheck className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

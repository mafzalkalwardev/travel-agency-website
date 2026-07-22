import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headphones, PlaneTakeoff, ShieldCheck } from "lucide-react";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, SITE } from "@/lib/constants";

type AccountAccessShellProps = {
  mode: "login" | "signup" | "forgot" | "reset";
  children: React.ReactNode;
};

const copy = {
  login: {
    eyebrow: "Welcome back",
    title: "Your journeys, organized in one secure place.",
    formTitle: "Sign in to your account",
    formText: "Access booking requests, passenger details and live status updates.",
  },
  signup: {
    eyebrow: "Partner & customer access",
    title: "Start a smarter way to manage travel.",
    formTitle: "Create your Al Qibla account",
    formText: "Set up your secure profile for faster quotations, bookings and follow-up.",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "We will help you get back into your account.",
    formTitle: "Forgot your password?",
    formText: "Enter your email and we will send a secure reset link from Al Qibla Air Services.",
  },
  reset: {
    eyebrow: "Account recovery",
    title: "Choose a new password and continue booking with confidence.",
    formTitle: "Set a new password",
    formText: "Pick a strong password for your Al Qibla customer account.",
  },
} as const;

export function AccountAccessShell({ mode, children }: AccountAccessShellProps) {
  const pageCopy = copy[mode];

  return (
    <section className="relative isolate overflow-hidden bg-[#f4efe7] px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#0a2342_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-[#6f8f82]/15 blur-3xl" />

      <div className="relative mx-auto grid min-h-[690px] max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_35px_100px_rgba(20,36,58,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative isolate hidden overflow-hidden bg-[#071d38] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(214,168,79,.22),transparent_28%),linear-gradient(145deg,transparent_35%,rgba(23,75,110,.65))]" />
          <FloatingAircraftLayer density="medium" className="opacity-70" />
          <AnimatedFlightPath variant="section" className="bottom-[24%] top-auto h-28 opacity-80" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src={assetPath(LOGO_PATH)} alt={SITE.name} width={58} height={58} className="h-14 w-14 rounded-2xl bg-white/10 object-contain ring-1 ring-white/15" unoptimized />
              <div>
                <p className="font-brand text-lg font-bold">Al Qibla Air Services</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-light">Travel Smart. Travel Safe.</p>
              </div>
            </Link>

            <div className="mt-20 max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
                <PlaneTakeoff className="h-4 w-4" /> {pageCopy.eyebrow}
              </span>
              <h2 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-tight xl:text-5xl">{pageCopy.title}</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/65">
                Professional booking access backed by real people, verified operations and responsive travel support.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: "Secure access" },
              { icon: BadgeCheck, label: "Verified service" },
              { icon: Headphones, label: "Human support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-gold" />
                <p className="mt-3 text-xs font-semibold text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="mb-9 inline-flex items-center gap-3 lg:hidden">
              <Image src={assetPath(LOGO_PATH)} alt={SITE.name} width={48} height={48} className="h-12 w-12 rounded-xl object-contain" unoptimized />
              <span className="font-brand font-bold text-navy">Al Qibla Air Services</span>
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d2f]">Secure travel portal</p>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">{pageCopy.formTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{pageCopy.formText}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

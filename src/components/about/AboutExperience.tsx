"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, Globe2, HeartHandshake,
  MapPin, Plane, ShieldCheck, Sparkles, Star, Users,
} from "lucide-react";
import { AirlineLogo } from "@/components/shared/AirlineLogo";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { airlines } from "@/data/airlines";
import { OFFICE_DISPLAY_ORDER, SITE, TRUST_TEXT } from "@/lib/constants";
import type { Review, ReviewStats } from "@/types";

const values = [
  { icon: HeartHandshake, title: "Personal service", text: "A dedicated travel team supports families, pilgrims, groups and organizations from inquiry to return." },
  { icon: ShieldCheck, title: "Clear and dependable", text: "Transparent quotations, documented requests and practical support throughout every journey." },
  { icon: Globe2, title: "Worldwide capability", text: "Domestic and international ticketing, Umrah, visas, hotels, tours and corporate travel under one roof." },
  { icon: Clock3, title: "Responsive support", text: "Fast assistance through our offices, phone and WhatsApp when plans change or urgent travel is required." },
];

const services = ["Worldwide air ticketing", "Umrah packages", "Group fares", "Corporate & NGO travel", "Visit visas", "Hotel reservations", "Tour packages", "Travel insurance"];

const portals = [
  { icon: Users, title: "Customer & Agent Portal", text: "Sign in to request bookings, save passenger details and follow booking progress.", href: "/account/login/", cta: "Open portal" },
  { icon: Plane, title: "Live Flight Inventory", text: "Search the complete synchronized group inventory with routes, dates, seats and fares.", href: "/available-tickets/", cta: "View live inventory" },
];

const founderHighlights = [
  "Founder-led, relationship-first service",
  "Head office in Peshawar, with Islamabad & Bannu branches",
  "Umrah, group fares, visas & corporate travel",
  "Transparent quotations with no hidden fees",
];

export function AboutExperience({ reviews, reviewStats }: { reviews: Review[]; reviewStats: ReviewStats }) {
  const reduced = useReducedMotion();
  // Keep content visible in print, screenshots, slow devices and no-JS fallbacks.
  // Motion is reserved for the orbital hero and interactive 3D card treatments.
  const reveal = {};

  return (
    <main className="overflow-hidden bg-white">
      <section className="relative isolate min-h-[640px] overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(11,93,168,.5),transparent_34%),radial-gradient(circle_at_15%_10%,rgba(214,168,79,.18),transparent_28%)]" />
        <div className="about-grid absolute inset-0 opacity-25" />
        <motion.div aria-hidden className="absolute right-[7%] top-24 hidden h-80 w-80 rounded-full border border-gold/20 lg:block" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}>
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <Plane className="absolute -right-5 top-1/2 h-10 w-10 -translate-y-1/2 rotate-12 text-gold" />
          <MapPin className="absolute bottom-10 left-3 h-7 w-7 text-white/70" />
        </motion.div>
        <div className="container-wide relative flex min-h-[640px] items-center py-24">
          <motion.div {...reveal} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-light"><Sparkles className="h-4 w-4" /> Established travel expertise, modern service</span>
            <h1 className="mt-7 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Travel built on trust, reach and <span className="text-gradient-gold">personal responsibility.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{SITE.name} serves pilgrims, families, agents, companies and NGOs with complete travel solutions from our offices in Khyber Pakhtunkhwa and Islamabad.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/inquiry/" className="inline-flex h-12 items-center gap-2 rounded-xl bg-gold px-6 font-semibold text-navy transition hover:bg-gold-light">Plan your journey <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/portal/" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 font-semibold text-white backdrop-blur hover:bg-white/10">Portal access</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <motion.div {...reveal}>
            <p className="text-sm font-bold uppercase tracking-[.22em] text-royal">Who we are</p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">One professional team for every stage of travel</h2>
            <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
              <p>We are a full-service travel agency specializing in Umrah packages, group air ticketing, worldwide flights and managed travel for organizations. Our team combines on-the-ground service with live digital inventory to make complex journeys simpler.</p>
              <p>From a family’s first inquiry to group seat coordination and corporate itinerary changes, we remain accessible, accountable and focused on a smooth result.</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{services.map((service) => <div key={service} className="flex items-center gap-2 text-sm font-medium text-navy"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />{service}</div>)}</div>
          </motion.div>
          <motion.div {...reveal} className="relative rounded-[2rem] border border-navy/10 bg-gradient-to-br from-navy to-navy-light p-7 text-white shadow-2xl shadow-navy/20 sm:p-10">
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-3xl border border-gold/25 bg-gold/10 backdrop-blur" />
            <BadgeCheck className="h-12 w-12 text-gold" />
            <h3 className="mt-6 text-2xl font-bold">Why choose Al Qibla</h3>
            <ul className="mt-6 space-y-4">{TRUST_TEXT.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-white/75"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f4efe7] text-navy">
        <div className="grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:items-stretch">
          {/* Left — edge-to-edge photo, height locked to the text column */}
          <motion.div {...reveal} className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-0">
            <Image
              src="/assets/team/farman-ullah-portrait.jpg"
              alt="Farman Ullah, Founder & CEO of Al Qibla Air Services"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-[center_42%]"
              priority
            />
          </motion.div>

          {/* Right — copy aligned to the photo */}
          <motion.div {...reveal} className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14 xl:pr-20 xl:pl-14">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a66d2f]">People behind your journey</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Meet our leadership
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
              Leadership that stays accountable from the first inquiry until every traveler is safely home.
            </p>

            <div className="mt-6 border-t border-navy/10 pt-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-gold">
                <BadgeCheck className="h-3.5 w-3.5" /> Founder &amp; CEO
              </span>
              <h3 className="mt-2.5 text-xl font-bold tracking-tight sm:text-2xl">Farman Ullah</h3>

              <div className="mt-3.5 max-w-lg space-y-2.5 text-[13px] leading-6 text-slate-700">
                <p>
                  Farman Ullah founded {SITE.name} on a simple conviction: travel should be dependable, transparent and genuinely personal. What began as a promise of honest fares and reliable service has grown into a full-service travel company trusted by pilgrims, families, agents and organizations.
                </p>
                <p>
                  Under his leadership, Al Qibla pairs on-the-ground expertise with modern, live inventory — Umrah, worldwide ticketing, group fares, visas, hotels and corporate travel from Peshawar, Islamabad and Bannu.
                </p>
                <p>
                  His approach is hands-on and relationship-first: clear quotations, documented requests, and a team accountable from first inquiry until every traveler is home.
                </p>
              </div>

              <div className="mt-4 grid max-w-lg gap-1.5 sm:grid-cols-2">
                {founderHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs font-medium text-navy">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {item}
                  </div>
                ))}
              </div>

              <figure className="mt-5 max-w-lg border-l-[3px] border-gold pl-3.5">
                <blockquote className="text-sm font-medium italic leading-6 text-navy">
                  “We don’t just book journeys — we take responsibility for them.”
                </blockquote>
                <figcaption className="mt-1 text-[11px] font-semibold text-slate-500">— Farman Ullah, Founder &amp; CEO</figcaption>
              </figure>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/inquiry/" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gold px-4 text-xs font-semibold text-navy transition hover:bg-gold-light">
                  Plan your journey <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-4 text-xs font-semibold text-navy transition hover:border-gold/50 hover:bg-gold/5"
                >
                  Message on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-secondary/60">
        <div className="container-wide">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[.22em] text-royal">Why choose us</p><h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Professional care with modern capability</h2></motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{values.map((value) => <article key={value.title} className="about-tilt-card rounded-2xl border border-border/70 bg-white p-6 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold"><value.icon className="h-6 w-6" /></div><h3 className="mt-5 text-lg font-bold text-navy">{value.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{value.text}</p></article>)}</div>
        </div>
      </section>

      <section className="section-padding bg-navy text-white">
        <div className="container-wide">
          <motion.div {...reveal} className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-gold">Airline network</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Airlines we work with</h2><p className="mt-3 max-w-2xl text-white/65">Our live inventory and ticketing network covers leading domestic, Gulf and international carriers.</p></div><p className="text-sm text-white/50">{airlines.length} airline partners represented</p></motion.div>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11">{airlines.map((airline) => <div key={airline.code} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:-translate-y-1 hover:border-gold/40 hover:bg-white/10"><AirlineLogo code={airline.code} name={airline.name} logo={airline.logo} size="sm" className="border-0" /><span className="line-clamp-1 w-full text-[10px] text-white/70">{airline.name}</span></div>)}</div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide">
          <motion.div {...reveal} className="text-center"><p className="text-sm font-bold uppercase tracking-[.22em] text-royal">Secure access</p><h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Your travel portals</h2></motion.div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">{portals.map((portal) => <article key={portal.title} className="group rounded-2xl border border-border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"><portal.icon className="h-9 w-9 text-royal" /><h3 className="mt-5 text-xl font-bold text-navy">{portal.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{portal.text}</p><Link href={portal.href} className="mt-6 inline-flex items-center gap-2 font-semibold text-royal">{portal.cta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></article>)}</div>
        </div>
      </section>

      <section className="section-padding bg-secondary/60">
        <div className="container-wide">
          <motion.div {...reveal} className="text-center"><p className="text-sm font-bold uppercase tracking-[.22em] text-royal">Where to find us</p><h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Visit an Al Qibla office</h2></motion.div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{OFFICE_DISPLAY_ORDER.map((office) => <article key={office.label} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><iframe title={`${office.label} map`} src={office.mapEmbed} className="h-48 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div className="p-6"><Building2 className="h-7 w-7 text-gold" /><h3 className="mt-4 text-lg font-bold text-navy">{office.label}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{office.address}</p><a href={`tel:${office.phoneTel}`} className="mt-4 inline-flex font-semibold text-royal">{office.phone}</a></div></article>)}</div>
        </div>
      </section>

      <section className="section-padding bg-navy-light text-white">
        <div className="container-wide">
          <motion.div {...reveal} className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.22em] text-gold">Approved client reviews</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Experiences shared by our travelers</h2></div>{reviewStats.count > 0 && <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3"><strong className="text-2xl text-gold">{reviewStats.average.toFixed(1)}</strong><span className="ml-2 text-sm text-white/60">from {reviewStats.count} approved reviews</span></div>}</motion.div>
          {reviews.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"><div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>{[1,2,3,4,5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= review.rating ? "fill-gold text-gold" : "text-white/20"}`} />)}</div><p className="mt-4 text-sm leading-7 text-white/80">“{review.comment}”</p><div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">{review.avatar_url ? <Image src={review.avatar_url} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold font-bold text-navy">{review.name.charAt(0).toUpperCase()}</div>}<div><p className="font-semibold">{review.name}</p><p className="text-xs text-gold-light">{[review.city, review.service].filter(Boolean).join(" · ") || "Verified client"}</p></div></div></article>)}</div> : <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/65">Approved customer reviews will appear here. We never invent testimonials.</div>}

          <div className="mt-12 max-w-xl">
            <p className="mb-4 text-sm text-white/70">
              Traveled with us? Share your experience — reviews appear after our team approves them.
            </p>
            <ReviewForm />
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { Plane, Search, TicketCheck, ShieldCheck } from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

const MILESTONES = [
  {
    icon: Search,
    title: "Search & Compare",
    text: "Live group fares from Pakistan to KSA, UAE and beyond — synced in real time.",
  },
  {
    icon: TicketCheck,
    title: "Hold Seats Instantly",
    text: "Reserve your seats with a booking hold and confirm on WhatsApp within minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Fly with Confidence",
    text: "IATA-verified agents, DTS registered, and 24/7 support until you land.",
  },
];

export function FlightPathStory() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop, reduced } = context.conditions as Record<string, boolean>;

          if (reduced) {
            gsap.set(".fp-milestone", { opacity: 1, y: 0 });
            gsap.set(".fp-plane", { opacity: 1 });
            return;
          }

          if (desktop) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=1400",
                pin: true,
                scrub: 1,
              },
            });

            tl.fromTo(
              ".fp-path-draw",
              { strokeDashoffset: 1000 },
              { strokeDashoffset: 0, ease: "none", duration: 3 },
              0
            );
            tl.to(
              ".fp-plane",
              {
                ease: "none",
                duration: 3,
                motionPath: {
                  path: ".fp-path",
                  align: ".fp-path",
                  alignOrigin: [0.5, 0.5],
                  autoRotate: true,
                },
              },
              0
            );
            MILESTONES.forEach((_, i) => {
              tl.fromTo(
                `.fp-milestone-${i}`,
                { opacity: 0, y: 32 },
                { opacity: 1, y: 0, duration: 0.6 },
                i * 0.9 + 0.3
              );
            });
          } else {
            // Mobile: simple non-pinned reveals
            gsap.set(".fp-plane", { opacity: 0 });
            gsap.utils.toArray<HTMLElement>(".fp-milestone").forEach((el) => {
              gsap.fromTo(
                el,
                { opacity: 0, y: 24 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  scrollTrigger: { trigger: el, start: "top 85%", once: true },
                }
              );
            });
          }
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-navy py-20 md:flex md:min-h-screen md:flex-col md:justify-center"
    >
      <div className="container-wide relative">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gold">How It Works</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white md:text-4xl">
            From Search to Boarding Pass
          </h2>
        </div>

        {/* Flight path */}
        <div className="relative mx-auto mt-10 hidden max-w-4xl md:block">
          <svg viewBox="0 0 800 160" fill="none" className="w-full" aria-hidden>
            <path
              className="fp-path"
              d="M20 130 C 220 20, 580 20, 780 130"
              stroke="transparent"
              strokeWidth="2"
            />
            <path
              className="fp-path-draw"
              d="M20 130 C 220 20, 580 20, 780 130"
              stroke="var(--gold)"
              strokeWidth="2"
              strokeDasharray="8 8"
              pathLength={1000}
              strokeDashoffset={1000}
            />
            <circle cx="20" cy="130" r="5" fill="var(--gold)" />
            <circle cx="780" cy="130" r="5" fill="var(--gold)" />
            <text x="20" y="155" fill="rgba(255,255,255,0.7)" fontSize="12" textAnchor="middle">
              Pakistan
            </text>
            <text x="780" y="155" fill="rgba(255,255,255,0.7)" fontSize="12" textAnchor="middle">
              Destination
            </text>
          </svg>
          <div className="fp-plane absolute left-0 top-0">
            <Plane className="h-7 w-7 rotate-45 text-gold" fill="currentColor" />
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {MILESTONES.map((m, i) => (
            <div
              key={m.title}
              className={`fp-milestone fp-milestone-${i} rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                <m.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-white">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

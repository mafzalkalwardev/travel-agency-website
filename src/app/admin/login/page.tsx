"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Lock, Mail } from "lucide-react";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { Button } from "@/components/ui/button";
import { LOGO_PATH, SITE } from "@/lib/constants";
import { assetPath } from "@/lib/base-path";

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function AdminLoginPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard/");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-royal/30" />
      <FloatingAircraftLayer density="low" />
      <AnimatedFlightPath variant="subtle" className="bottom-[15%] h-24 opacity-40" />

      <motion.div
        className="relative w-full max-w-md"
        variants={reduced ? undefined : cardVariants}
        initial={reduced ? false : "hidden"}
        animate="show"
      >
        <div className="rounded-2xl border border-white/10 bg-navy-light/90 p-8 shadow-2xl shadow-black/30 backdrop-blur-md">
          <motion.div
            className="mb-8 text-center"
            variants={reduced ? undefined : stagger}
            initial={reduced ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={reduced ? undefined : item}>
              <motion.div
                initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-fit rounded-xl ring-2 ring-gold/30 ring-offset-2 ring-offset-navy-light"
              >
                <Image
                  src={assetPath(LOGO_PATH)}
                  alt={SITE.name}
                  width={72}
                  height={72}
                  className="rounded-lg"
                  unoptimized
                  priority
                />
              </motion.div>
            </motion.div>
            <motion.h1
              variants={reduced ? undefined : item}
              className="mt-5 font-heading text-2xl font-bold text-white"
            >
              Admin Login
            </motion.h1>
            <motion.p variants={reduced ? undefined : item} className="mt-1 text-sm text-gold-light/80">
              {SITE.name}
            </motion.p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={reduced ? undefined : stagger}
            initial={reduced ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={reduced ? undefined : item}>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-white/80" htmlFor="email">
                <Mail className="h-3.5 w-3.5 text-gold" />
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-white transition-colors placeholder:text-white/30 focus:border-gold/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="admin@example.com"
              />
            </motion.div>

            <motion.div variants={reduced ? undefined : item}>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-white/80" htmlFor="password">
                <Lock className="h-3.5 w-3.5 text-gold" />
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-white transition-colors placeholder:text-white/30 focus:border-gold/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="••••••••"
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden rounded-lg border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div variants={reduced ? undefined : item}>
              <Button type="submit" variant="primaryGold" className="w-full" disabled={loading}>
                <motion.span
                  key={loading ? "loading" : "idle"}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </motion.span>
              </Button>
            </motion.div>
          </motion.form>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <p className="text-center text-xs text-white/40">Authorized personnel only</p>
          <a
            href="https://www.induswebagency.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:-translate-y-0.5 hover:border-gold/70 hover:bg-gold/20 hover:text-gold"
          >
            <span className="font-medium normal-case tracking-normal text-white/70 group-hover:text-white/90">
              Made by
            </span>
            <span className="font-bold tracking-[0.12em]">INDUS WEB AGENCY</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

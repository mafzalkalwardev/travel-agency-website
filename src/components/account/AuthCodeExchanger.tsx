"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Completes Supabase email confirmation / magic-link when landing with
 * ?code= or #access_token= on account login (or other auth pages).
 */
export function AuthCodeExchanger({ onDone }: { onDone?: (ok: boolean) => void }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const href = window.location.href;
      if (!href.includes("code=") && !href.includes("access_token=")) {
        onDone?.(false);
        return;
      }
      setStatus("working");
      const supabase = createClient();
      try {
        await supabase.auth.exchangeCodeForSession(href);
        if (!cancelled) {
          setStatus("done");
          onDone?.(true);
          // Strip tokens from the URL so refreshes don't re-exchange.
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          url.hash = "";
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          onDone?.(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  if (status === "working") {
    return (
      <p className="mb-4 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-navy">
        Confirming your email…
      </p>
    );
  }
  if (status === "done") {
    return (
      <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        Email confirmed. You can sign in now.
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="mb-4 rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
        Confirmation link is invalid or expired. Request a new one from signup or forgot password.
      </p>
    );
  }
  return null;
}

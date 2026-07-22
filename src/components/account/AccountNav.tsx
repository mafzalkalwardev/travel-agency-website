"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAgent, setIsAgent] = useState(true);
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) return;

    const supabase = createClient();

    async function syncUser(userId?: string | null) {
      if (!userId) {
        setSignedIn(false);
        setIsAgent(true);
        return;
      }
      setSignedIn(true);
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setIsAgent((profile?.role || "agent") === "agent");
    }

    supabase.auth.getUser().then(({ data }) => syncUser(data.user?.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user?.id);
    });
    return () => data.subscription.unsubscribe();
  }, [supabaseReady]);

  const label = signedIn ? (isAgent ? "Agent portal" : "My Trips") : "Sign In";
  const Icon = signedIn && isAgent ? Briefcase : UserRound;

  return (
    <Link
      href={signedIn ? "/account/" : "/account/login/"}
      className={cn(buttonVariants({ variant: "outlineLight", size: "default" }), "hidden h-10 px-4 md:inline-flex")}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Link>
  );
}

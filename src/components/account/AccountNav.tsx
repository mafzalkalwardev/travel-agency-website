"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const [signedIn, setSignedIn] = useState(false);
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, [supabaseReady]);

  return (
    <Link
      href={signedIn ? "/account/" : "/account/login/"}
      className={cn(buttonVariants({ variant: "outlineLight", size: "default" }), "hidden h-10 px-4 md:inline-flex")}
    >
      <UserRound className="mr-2 h-4 w-4" />
      {signedIn ? "My Trips" : "Sign In"}
    </Link>
  );
}


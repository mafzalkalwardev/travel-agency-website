import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Plane,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/ProfileForm";
import { AgentBookingsList } from "@/components/account/AgentBookingsList";
import { SignOutButton } from "@/components/account/SignOutButton";
import { getApprovalMessage } from "@/lib/customer-approval";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus, CustomerProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: PAGE_SEO.account.title,
  description: PAGE_SEO.account.description,
  path: PAGE_SEO.account.path,
  keywords: PAGE_SEO.account.keywords,
});

const statusColors: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_confirmed: "bg-blue-100 text-blue-800",
  booking_in_progress: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section-padding bg-slate-50">
        <div className="container-wide">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Configure Supabase to enable agent accounts.
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login/?next=/account/");

  const { data: existingProfile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let profile = existingProfile;

  if (!profile) {
    const { data: createdProfile } = await supabase
      .from("customer_profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        full_name: String(user.user_metadata?.full_name || ""),
        phone: String(user.user_metadata?.phone || ""),
        company_name: String(user.user_metadata?.company_name || "") || null,
        city: String(user.user_metadata?.city || "") || null,
        address: String(user.user_metadata?.address || "") || null,
        role: "agent",
        approval_status: "pending",
      })
      .select("*")
      .single();
    profile = createdProfile;
  }

  if (!profile) redirect("/account/login/?next=/account/");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false });

  const safeProfile = profile as CustomerProfile;
  const customerBookings = (bookings || []) as Booking[];
  const isAgent = (safeProfile.role || "agent") === "agent";
  const approvalStatus = safeProfile.approval_status || "pending";
  const canBook = approvalStatus === "approved";
  const approvalTone =
    approvalStatus === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : approvalStatus === "rejected"
        ? "border-red-accent/30 bg-red-accent/10 text-red-accent"
        : "border-gold/30 bg-gold/10 text-navy";

  const companyLabel = safeProfile.company_name || "Your agency";
  const contactLabel = safeProfile.full_name || user.email || "Agent";

  return (
    <section className="bg-slate-50 py-10">
      <div className="container-wide space-y-6">
        <div className="flex flex-col gap-4 rounded-xl bg-navy p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-gold-light">
              {isAgent ? "Agent Portal" : "Travel Account"}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold">{companyLabel}</h1>
            <p className="mt-2 text-white/80">
              {contactLabel}
              {safeProfile.city ? ` · ${safeProfile.city}` : ""}
            </p>
            <p className="mt-1 text-sm text-white/55">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canBook ? (
              <Link
                href="/available-tickets/"
                className={cn(buttonVariants({ variant: "primaryGold" }), "h-10")}
              >
                Browse inventory
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric icon={<Plane className="h-5 w-5" />} label="Total bookings" value={customerBookings.length} />
          <Metric
            icon={<CalendarDays className="h-5 w-5" />}
            label="Pending payment"
            value={customerBookings.filter((b) => b.status === "pending_payment").length}
          />
          <Metric
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Confirmed"
            value={customerBookings.filter((b) => b.status === "confirmed" || b.status === "payment_confirmed").length}
          />
        </div>

        <Card className={approvalTone}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {canBook ? "Ready to book" : "Awaiting approval"}
                </p>
                <p className="mt-1 font-medium">{getApprovalMessage(approvalStatus)}</p>
              </div>
              <Badge
                className={
                  statusColors[
                    approvalStatus === "approved"
                      ? "confirmed"
                      : approvalStatus === "rejected"
                        ? "failed"
                        : "pending_payment"
                  ]
                }
              >
                {approvalStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {(safeProfile.company_name || safeProfile.city || safeProfile.address) && (
          <Card>
            <CardContent className="grid gap-3 p-5 text-sm sm:grid-cols-3">
              <p className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">Company</span>
                  {safeProfile.company_name || "—"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">City</span>
                  {safeProfile.city || "—"}
                </span>
              </p>
              <p className="flex items-start gap-2 sm:col-span-1">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">Contact</span>
                  {safeProfile.full_name || "—"}
                  {safeProfile.phone ? ` · ${safeProfile.phone}` : ""}
                </span>
              </p>
              {safeProfile.address ? (
                <p className="sm:col-span-3 text-muted-foreground">
                  <strong className="text-navy">Address:</strong> {safeProfile.address}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <Building2 className="h-5 w-5 text-gold" /> Agency profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={safeProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">{isAgent ? "My bookings" : "Booking Requests"}</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentBookingsList bookings={customerBookings} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-navy">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

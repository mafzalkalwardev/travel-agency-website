import { redirect } from "next/navigation";
import { CalendarDays, CircleDollarSign, Plane, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/ProfileForm";
import { SignOutButton } from "@/components/account/SignOutButton";
import { getApprovalMessage } from "@/lib/customer-approval";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPageMetadata } from "@/lib/metadata";
import type { Booking, BookingStatus, CustomerProfile } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "My Trips",
  description: "Manage your Al Qibla profile, booking requests, passenger details, and trip statuses.",
  path: "/account/",
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
              Configure Supabase to enable customer accounts.
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
  const approvalStatus = safeProfile.approval_status || "pending";
  const approvalTone =
    approvalStatus === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : approvalStatus === "rejected"
        ? "border-red-accent/30 bg-red-accent/10 text-red-accent"
        : "border-gold/30 bg-gold/10 text-navy";

  return (
    <section className="bg-slate-50 py-10">
      <div className="container-wide space-y-6">
        <div className="flex flex-col gap-4 rounded-xl bg-navy p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-gold-light">Customer Portal</p>
            <h1 className="mt-1 font-heading text-3xl font-bold">My Trips</h1>
            <p className="mt-2 text-white/70">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric icon={<Plane className="h-5 w-5" />} label="Total Requests" value={customerBookings.length} />
          <Metric icon={<CalendarDays className="h-5 w-5" />} label="Pending" value={customerBookings.filter((b) => b.status === "pending_payment").length} />
          <Metric icon={<CircleDollarSign className="h-5 w-5" />} label="Confirmed" value={customerBookings.filter((b) => b.status === "confirmed").length} />
        </div>

        <Card className={`${approvalTone}`}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">Approval Status</p>
                <p className="mt-1 font-medium">{getApprovalMessage(approvalStatus)}</p>
              </div>
              <Badge className={statusColors[approvalStatus === "approved" ? "confirmed" : approvalStatus === "rejected" ? "failed" : "pending_payment"]}>
                {approvalStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <UserRound className="h-5 w-5 text-gold" /> Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={safeProfile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Booking Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {customerBookings.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
                No booking requests yet. Start from available tickets, packages, or flight search.
              </p>
            ) : (
              <div className="space-y-4">
                {customerBookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="font-heading text-lg font-semibold text-navy">
                          {booking.product_title || booking.product_type}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Ref {booking.id.slice(0, 8).toUpperCase()} - {new Date(booking.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                      <p><strong className="text-slate-900">Type:</strong> {booking.product_type}</p>
                      <p><strong className="text-slate-900">Passengers:</strong> {booking.passengers}</p>
                      <p><strong className="text-slate-900">Price:</strong> {Number(booking.quoted_price).toLocaleString()} {booking.currency}</p>
                      <p><strong className="text-slate-900">Phone:</strong> {booking.customer_phone}</p>
                    </div>
                    {booking.passenger_details && Object.keys(booking.passenger_details).length > 0 && (
                      <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        {JSON.stringify(booking.passenger_details, null, 2)}
                      </pre>
                    )}
                    {booking.error_message && (
                      <p className="mt-3 rounded-md bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
                        {booking.error_message}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
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

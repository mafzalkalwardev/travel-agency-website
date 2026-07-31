"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toast } from "sonner";
import type { CustomerProfile } from "@/types";

const badgeStyles: Record<CustomerProfile["approval_status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-accent/10 text-red-accent",
};

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [filter, setFilter] = useState<CustomerProfile["approval_status"] | "all">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let query = supabase.from("customer_profiles").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("approval_status", filter);
    const { data } = await query;
    setProfiles((data as CustomerProfile[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((profile) => {
      const haystack = [
        profile.company_name,
        profile.full_name,
        profile.email,
        profile.phone,
        profile.city,
        profile.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [profiles, search]);

  async function updateStatus(id: string, approvalStatus: CustomerProfile["approval_status"]) {
    const res = await fetch(`/api/admin/customers/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_status: approvalStatus }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || "Failed to update customer");
      return;
    }
    const emailed = Boolean((json as { emailSent?: boolean }).emailSent);
    toast.success(
      emailed
        ? `Agent ${approvalStatus} — email sent`
        : `Agent ${approvalStatus}`
    );
    load();
  }

  function openPasswordPanel(id: string) {
    setPasswordUserId(id);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function setUserPassword(id: string) {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error || "Could not update password");
        return;
      }
      toast.success("Password updated");
      setPasswordUserId(null);
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function sendPasswordReset(id: string) {
    setPasswordBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_reset: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error || "Could not send reset");
        return;
      }
      if ((json as { mode?: string }).mode === "email_sent") {
        toast.success("Password reset email sent");
      } else if ((json as { resetLink?: string }).resetLink) {
        await navigator.clipboard.writeText((json as { resetLink: string }).resetLink);
        toast.success("Reset link copied to clipboard");
      } else {
        toast.success("Reset prepared");
      }
    } finally {
      setPasswordBusy(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Configure Supabase to manage agent approvals.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Agent Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Approve agencies, and reset or set user passwords when they need account access help.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "navy" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search company, email, phone, city…"
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : visibleProfiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {profiles.length === 0 ? "No agent profiles found." : "No agents match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleProfiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold text-navy">
                    {profile.company_name || profile.full_name || "Unnamed Agency"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {profile.full_name ? `${profile.full_name} · ` : ""}
                    {profile.email} · {new Date(profile.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge className={badgeStyles[profile.approval_status]}>
                  {profile.approval_status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <p><strong>Company:</strong> {profile.company_name || "-"}</p>
                  <p><strong>Contact:</strong> {profile.full_name || "-"}</p>
                  <p><strong>Phone:</strong> {profile.phone || "-"}</p>
                  <p><strong>City:</strong> {profile.city || "-"}</p>
                  <p><strong>Role:</strong> {profile.role || "customer"}</p>
                  <p><strong>Preferred Airport:</strong> {profile.preferred_airport || "-"}</p>
                </div>
                {profile.address && (
                  <p>
                    <strong>Address:</strong> {profile.address}
                  </p>
                )}
                {profile.approval_notes && (
                  <p className="text-muted-foreground">
                    <strong>Notes:</strong> {profile.approval_notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.approval_status !== "approved" && (
                    <Button size="sm" variant="navy" onClick={() => updateStatus(profile.id, "approved")}>
                      Approve
                    </Button>
                  )}
                  {profile.approval_status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(profile.id, "rejected")}>
                      Reject
                    </Button>
                  )}
                  {profile.approval_status !== "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(profile.id, "pending")}>
                      Reset to Pending
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPasswordPanel(profile.id)}
                  >
                    Set password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={passwordBusy}
                    onClick={() => sendPasswordReset(profile.id)}
                  >
                    Send reset link
                  </Button>
                </div>

                {passwordUserId === profile.id && (
                  <div className="mt-2 space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-sm font-semibold text-navy">
                      Set a new password for {profile.email || profile.full_name || "this user"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password (min 8)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="navy"
                        disabled={passwordBusy}
                        onClick={() => setUserPassword(profile.id)}
                      >
                        {passwordBusy ? "Saving…" : "Update password"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={passwordBusy}
                        onClick={() => setPasswordUserId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

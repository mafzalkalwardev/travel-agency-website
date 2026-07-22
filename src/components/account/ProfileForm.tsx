"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { CustomerProfile } from "@/types";

interface ProfileFormProps {
  profile: CustomerProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: profile.company_name || "",
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    city: profile.city || "",
    nationality: profile.nationality || "",
    passport_number: profile.passport_number || "",
    date_of_birth: profile.date_of_birth || "",
    preferred_airport: profile.preferred_airport || "",
    address: profile.address || "",
    emergency_contact_name: profile.emergency_contact_name || "",
    emergency_contact_phone: profile.emergency_contact_phone || "",
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customer_profiles")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="profile-company">Company / agency name</Label>
        <Input
          id="profile-company"
          value={form.company_name}
          onChange={(event) => setForm({ ...form, company_name: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-name">Contact person full name</Label>
        <Input id="profile-name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-phone">Phone / WhatsApp</Label>
        <Input id="profile-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-city">City</Label>
        <Input id="profile-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-nationality">Nationality</Label>
        <Input id="profile-nationality" value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-passport">Passport / CNIC</Label>
        <Input id="profile-passport" value={form.passport_number} onChange={(event) => setForm({ ...form, passport_number: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-dob">Date of birth</Label>
        <Input id="profile-dob" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-airport">Preferred airport</Label>
        <Input id="profile-airport" placeholder="PEW, ISB, LHE..." value={form.preferred_airport} onChange={(event) => setForm({ ...form, preferred_airport: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-emergency-name">Emergency contact name</Label>
        <Input id="profile-emergency-name" value={form.emergency_contact_name} onChange={(event) => setForm({ ...form, emergency_contact_name: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-emergency-phone">Emergency contact phone</Label>
        <Input id="profile-emergency-phone" value={form.emergency_contact_phone} onChange={(event) => setForm({ ...form, emergency_contact_phone: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="profile-address">Company address</Label>
        <Textarea id="profile-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" variant="navy" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}


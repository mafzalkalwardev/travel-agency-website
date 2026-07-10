"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITE } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

const services = ["Umrah Package", "Group Tickets", "Tour Package", "Visit Visa", "Corporate Travel", "Other"];

export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", service: "", travelDate: "", persons: "1", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const text = [
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Service: ${form.service}`,
      form.travelDate && `Date: ${form.travelDate}`,
      `Persons: ${form.persons}`,
      form.message && `Message: ${form.message}`,
    ].filter(Boolean).join("\n");

    try {
      await fetch("/api/inquiries/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking",
          name: form.name,
          phone: form.phone,
          service: form.service,
          travel_date: form.travelDate || undefined,
          passengers: Number(form.persons) || 1,
          message: form.message || text,
          source_page: "/inquiry/",
        }),
      });
    } catch {
      /* continue to WhatsApp */
    }

    window.open(whatsappLink(`Hello ${SITE.name}, booking inquiry:\n\n${text}`), "_blank");
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-gold/30 bg-white p-6 text-center">
        <h3 className="font-semibold text-navy">Inquiry sent!</h3>
        <p className="mt-2 text-sm text-muted-foreground">Opened in WhatsApp — we&apos;ll respond shortly.</p>
        <Button variant="primaryGold" className="mt-4" size="sm" onClick={() => setSubmitted(false)}>Send Another</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input required className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">WhatsApp *</Label>
            <Input required className="h-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Service *</Label>
          <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select service" /></SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Travel Date</Label>
            <Input type="date" className="h-9" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Persons</Label>
            <Input type="number" min={1} className="h-9" value={form.persons} onChange={(e) => setForm({ ...form, persons: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you need..." />
        </div>
        <Button type="submit" variant="primaryGold" className="w-full" disabled={loading}>
          {loading ? "Submitting..." : "Submit via WhatsApp"}
        </Button>
      </form>
    </div>
  );
}

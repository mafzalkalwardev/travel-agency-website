"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", service: "", departureCity: "", travelDate: "", persons: "1", packageType: "", budget: "", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const text = [
      `Name: ${form.name}`,
      `Phone/WhatsApp: ${form.phone}`,
      form.email && `Email: ${form.email}`,
      `Service: ${form.service}`,
      form.departureCity && `Departure: ${form.departureCity}`,
      form.travelDate && `Date: ${form.travelDate}`,
      `Persons: ${form.persons}`,
      form.packageType && `Package: ${form.packageType}`,
      form.budget && `Budget: ${form.budget}`,
      form.message && `Message: ${form.message}`,
    ].filter(Boolean).join("\n");

    try {
      await fetch("/api/inquiries/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking",
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          from_city: form.departureCity,
          travel_date: form.travelDate || undefined,
          passengers: Number(form.persons) || 1,
          budget: form.budget ? parseFloat(form.budget.replace(/[^\d.]/g, "")) : undefined,
          message: form.message || text,
          source_page: "/inquiry/",
        }),
      });
    } catch {
      /* continue to WhatsApp */
    }

    window.open(whatsappLink(`Hello ${SITE.name}, I would like to make a booking inquiry:\n\n${text}`), "_blank");
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <Card className="border-gold/30">
        <CardContent className="p-8 text-center">
          <h3 className="font-heading text-xl font-semibold text-navy">Inquiry Sent!</h3>
          <p className="mt-2 text-muted-foreground">Your inquiry was saved and opened in WhatsApp. We will respond shortly.</p>
          <Button variant="primaryGold" className="mt-4" onClick={() => setSubmitted(false)}>Send Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="font-heading text-navy">Booking / Inquiry Form</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Full Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp Number *</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Service *</Label>
            <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {["Umrah Package", "Group Tickets", "Tour Package", "Visit Visa", "Corporate Travel", "Hotel", "Other"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Departure City</Label><Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} /></div>
            <div className="space-y-2"><Label>Travel Date</Label><Input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Number of Persons</Label><Input type="number" min={1} value={form.persons} onChange={(e) => setForm({ ...form, persons: e.target.value })} /></div>
            <div className="space-y-2"><Label>Package Type</Label><Input placeholder="Economy / Premium / Group" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Budget Range</Label><Input placeholder="e.g. PKR 300,000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <Button type="submit" variant="primaryGold" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit via WhatsApp"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

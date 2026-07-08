"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  "Air Ticketing",
  "Umrah Package",
  "Tour Package",
  "Visit Visa",
  "Hotel Reservation",
  "Corporate Travel",
  "Travel Insurance",
  "Other",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          message: form.message,
          source_page: "/contact/",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit inquiry");
      setStatus("success");
      setMessage(data.message || "Your inquiry has been received. We will contact you shortly via phone or WhatsApp.");
      setForm({ name: "", email: "", phone: "", service: "", message: "" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit inquiry. Please contact us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <Card className="border-gold/30">
        <CardContent className="p-8 text-center">
          <h3 className="font-heading text-xl font-semibold text-navy">Thank You!</h3>
          <p className="mt-2 text-muted-foreground">
            {message}
          </p>
          <Button variant="primaryGold" className="mt-4" onClick={() => setStatus("idle")}>
            Send Another Inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="font-heading text-navy">Send Us an Inquiry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone / WhatsApp *</Label>
              <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Service Required *</Label>
            <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })} required>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your travel requirements..."
            />
          </div>
          {status === "error" && (
            <p className="rounded-md border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
              {message}
            </p>
          )}
          <Button type="submit" variant="primaryGold" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Inquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

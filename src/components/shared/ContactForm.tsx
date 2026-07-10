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

const services = [
  "Air Ticketing",
  "Umrah Package",
  "Tour Package",
  "Visit Visa",
  "Hotel Reservation",
  "Corporate Travel",
  "Other",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
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
          phone: form.phone,
          service: form.service,
          message: form.message,
          source_page: "/contact/",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit inquiry");
      setStatus("success");
      setMessage(data.message || "We'll contact you shortly on WhatsApp.");
      setForm({ name: "", phone: "", service: "", message: "" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit. Please message us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-gold/30 bg-white p-6 text-center">
        <h3 className="font-semibold text-navy">Thank you!</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button variant="primaryGold" className="mt-4" size="sm" onClick={() => setStatus("idle")}>
          Send Another
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-navy">Send an Inquiry</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Name *</Label>
            <Input id="name" required className="h-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Phone / WhatsApp *</Label>
            <Input id="phone" required className="h-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Service *</Label>
          <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })} required>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Select service" /></SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-xs">Message *</Label>
          <Textarea
            id="message"
            required
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Your travel requirements..."
          />
        </div>
        {status === "error" && (
          <p className="text-xs text-brand-red">{message}</p>
        )}
        <Button type="submit" variant="primaryGold" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}

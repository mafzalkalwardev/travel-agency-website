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
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Headphones, Send } from "lucide-react";

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
    <Card className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-[0_30px_90px_rgba(25,45,65,.14)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#284d44] via-[#35665a] to-[#8b6a3d] p-7 text-white sm:p-9">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-navy"><Headphones className="h-5 w-5" /></div>
        <h2 className="relative mt-5 text-2xl font-bold">Tell us where you want to go</h2>
        <p className="relative mt-2 max-w-lg text-sm leading-6 text-white/70">Share your travel requirements and a specialist will respond with practical options, availability and a clear quotation.</p>
        <div className="relative mt-5 flex flex-wrap gap-4 text-xs text-white/75"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gold" />No obligation</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gold" />Human response</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gold" />Transparent pricing</span></div>
      </div>
      <CardContent className="p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" placeholder="Your full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone / WhatsApp *</Label>
              <Input id="phone" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" placeholder="e.g. +92 331 5576169" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" placeholder="you@company.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Service Required *</Label>
            <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })} required>
              <SelectTrigger className="h-12 w-full rounded-xl border-navy/10 bg-[#faf8f4]"><SelectValue placeholder="Choose the service you need" /></SelectTrigger>
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
              rows={5}
              className="rounded-xl border-navy/10 bg-[#faf8f4]"
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
          <Button type="submit" variant="primaryGold" size="lg" className="h-12 w-full text-base" disabled={loading}>
            {loading ? "Sending securely..." : <><Send className="mr-2 h-4 w-4" />Send my travel request<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

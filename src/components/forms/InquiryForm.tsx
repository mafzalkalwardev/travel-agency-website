"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, Headphones, MapPin, MessageCircle, PlaneTakeoff, UsersRound } from "lucide-react";
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
      <div className="rounded-[2rem] border border-emerald-200 bg-white p-10 text-center shadow-[0_30px_90px_rgba(20,45,38,.12)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></span>
        <h3 className="mt-6 font-heading text-3xl font-semibold text-navy">Your journey request is on its way</h3>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Your inquiry was saved and opened in WhatsApp. An Al Qibla travel specialist will respond shortly.</p>
        <Button variant="primaryGold" className="mt-7 h-12 rounded-xl px-6" onClick={() => setSubmitted(false)}>Plan another journey</Button>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_35px_100px_rgba(25,45,65,.14)] lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="relative isolate overflow-hidden bg-[#183f3a] p-8 text-white sm:p-10 lg:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#8fb09b]/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-light"><PlaneTakeoff className="h-4 w-4" /> Personal travel desk</span>
          <h2 className="mt-6 font-heading text-3xl font-bold leading-tight sm:text-4xl">Tell us the journey. We&apos;ll shape the right plan.</h2>
          <p className="mt-4 text-sm leading-7 text-white/65">Share the essentials once. Our team will review dates, routes, availability and budget before responding with practical options.</p>

          <div className="mt-10 space-y-4">
            {[
              { icon: BadgeCheck, title: "Real travel specialists", text: "Your request is reviewed by our operations team." },
              { icon: Headphones, title: "Clear human follow-up", text: "Continue directly through phone or WhatsApp." },
              { icon: MessageCircle, title: "Fast WhatsApp handoff", text: "Your completed request opens ready to send." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold"><Icon className="h-5 w-5" /></span>
                <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-white/55">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10 lg:p-12">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2e6d2] text-[#986328]"><MapPin className="h-5 w-5" /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#986328]">Journey request</p><h2 className="font-heading text-2xl font-bold text-navy">Plan with Al Qibla</h2></div>
        </div>

        <div className="mt-7 space-y-7">
          <FormSection title="Your contact details" number="01">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *"><Input required placeholder="Your full name" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="WhatsApp number *"><Input required placeholder="+92 300 0000000" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            </div>
            <Field label="Email address"><Input type="email" placeholder="you@example.com" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </FormSection>

          <FormSection title="Travel plan" number="02">
            <Field label="Service required *">
              <Select value={form.service} onValueChange={(v) => v && setForm({ ...form, service: v })} required>
                <SelectTrigger className="h-12 w-full rounded-xl border-navy/10 bg-[#faf8f4]"><SelectValue placeholder="Choose a travel service" /></SelectTrigger>
                <SelectContent>{["Umrah Package", "Group Tickets", "Tour Package", "Visit Visa", "Corporate Travel", "Hotel", "Other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Departure city" icon={MapPin}><Input placeholder="Peshawar, Islamabad..." className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} /></Field>
              <Field label="Travel date" icon={CalendarDays}><Input type="date" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} /></Field>
              <Field label="Number of travelers" icon={UsersRound}><Input type="number" min={1} className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.persons} onChange={(e) => setForm({ ...form, persons: e.target.value })} /></Field>
              <Field label="Travel style"><Input placeholder="Economy / Premium / Group" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })} /></Field>
            </div>
            <Field label="Estimated budget"><Input placeholder="e.g. PKR 300,000" className="h-12 rounded-xl border-navy/10 bg-[#faf8f4]" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
            <Field label="Anything else we should know?"><Textarea rows={4} className="rounded-xl border-navy/10 bg-[#faf8f4]" placeholder="Route preferences, hotel needs, visa status or any special requirements..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          </FormSection>

          <Button type="submit" variant="primaryGold" className="h-13 w-full rounded-xl text-base shadow-lg shadow-gold/20" disabled={loading}>
            {loading ? "Preparing your request..." : <>Continue securely on WhatsApp <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <fieldset className="space-y-4"><legend className="mb-4 flex items-center gap-3 text-sm font-bold text-navy"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-[10px] text-gold">{number}</span>{title}</legend>{children}</fieldset>;
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof MapPin; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="flex items-center gap-2 font-semibold text-navy">{Icon && <Icon className="h-3.5 w-3.5 text-[#a66d2f]" />}{label}</Label>{children}</div>;
}

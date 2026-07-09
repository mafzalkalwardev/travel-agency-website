"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatMap } from "@/components/flight/SeatMap";
import { bookingAddOns, mockFlights } from "@/data/flight-booking";
import { canCustomerBook, getApprovalMessage } from "@/lib/customer-approval";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  validatePassengerDetails,
} from "@/lib/flight-booking";
import { SITE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { buildBookingWhatsAppMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { BookingAddOn, PassengerDetails, Seat } from "@/types/flight-booking";

const steps = ["Review", "Passenger", "Seat", "Add-ons", "Submit", "Confirm"];

interface BookingFlowClientProps {
  flightId?: string;
}

export function BookingFlowClient({ flightId }: BookingFlowClientProps) {
  const flight = mockFlights.find((item) => item.id === flightId) || mockFlights[0];
  const [step, setStep] = useState(0);
  const [accountState, setAccountState] = useState<"checking" | "signed_out" | "pending" | "approved" | "rejected">("checking");
  const [selectedSeat, setSelectedSeat] = useState<Seat | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<BookingAddOn[]>([]);
  const [processing, setProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof PassengerDetails, string>>>({});
  const [passenger, setPassenger] = useState<PassengerDetails>({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    documentNumber: "",
    email: "",
    phone: "",
  });

  const total = useMemo(
    () => flight.price + (selectedSeat?.price || 0) + selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0),
    [flight.price, selectedAddOns, selectedSeat]
  );

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setAccountState("signed_out");
        return;
      }

      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("approval_status")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!active) return;
      setAccountState((profile?.approval_status as typeof accountState) || "pending");
    });

    return () => {
      active = false;
    };
  }, []);

  async function next() {
    if (step === 1) {
      const result = validatePassengerDetails(passenger);
      setErrors(result);
      if (Object.keys(result).length) return;
    }
    if (step === 4) {
      await submitBookingRequest();
      return;
    }
    setSubmitError("");
    setStep((value) => Math.min(5, value + 1));
  }

  async function submitBookingRequest() {
    setSubmitError("");
    const result = validatePassengerDetails(passenger);
    setErrors(result);
    if (Object.keys(result).length) {
      setStep(1);
      return;
    }

    try {
      setProcessing(true);
      if (accountState === "signed_out") {
        window.location.href = "/account/login/?next=/flight-booking/book/";
        return;
      }
      const approvalStatus = accountState === "checking" ? "pending" : accountState;
      if (!canCustomerBook(approvalStatus)) {
        throw new Error(getApprovalMessage(approvalStatus));
      }
      const addOnSummary = selectedAddOns.length
        ? selectedAddOns.map((addOn) => `${addOn.title} (${formatCurrency(addOn.price, flight.currency)})`).join(", ")
        : "None";
      const res = await fetch("/api/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: "ticket",
          customer_name: `${passenger.firstName} ${passenger.lastName}`.trim(),
          customer_phone: passenger.phone,
          customer_email: passenger.email || undefined,
          passengers: 1,
          quoted_price: total,
          currency: flight.currency,
          product_title: `${flight.airline} ${flight.flightNumber} - ${flight.from} to ${flight.to}`,
          source_page: "/flight-booking/book/",
          passenger_details: {
            names: `${passenger.firstName} ${passenger.lastName}`.trim(),
            passport: passenger.documentNumber,
            notes: [
              `Gender: ${passenger.gender}`,
              `Date of birth: ${passenger.dateOfBirth}`,
              `Seat: ${selectedSeat ? `${selectedSeat.id} (${formatCurrency(selectedSeat.price, flight.currency)})` : "Not selected"}`,
              `Add-ons: ${addOnSummary}`,
            ].join("\n"),
          },
        }),
      });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = "/account/login/?next=/flight-booking/book/";
        return;
      }
      if (!res.ok) throw new Error(json.error || "Could not submit booking request");
      const ref = json.bookingRef || "";
      setBookingRef(ref);
      const waMsg = buildBookingWhatsAppMessage({
        bookingRef: ref,
        productTitle: `${flight.airline} ${flight.flightNumber} - ${flight.from} to ${flight.to}`,
        customerName: `${passenger.firstName} ${passenger.lastName}`.trim(),
        customerPhone: passenger.phone,
        passengers: 1,
        quotedPrice: total,
        currency: flight.currency,
        supplierRef: json.supplierRef || undefined,
      });
      window.location.href = whatsappLink(waMsg);
      return;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit booking request");
    } finally {
      setProcessing(false);
    }
  }

  function toggleAddOn(addOn: BookingAddOn) {
    setSelectedAddOns((items) =>
      items.some((item) => item.id === addOn.id)
        ? items.filter((item) => item.id !== addOn.id)
        : [...items, addOn]
    );
  }

  return (
    <div className="bg-slate-50">
      <section className="bg-navy py-10 text-white">
        <div className="container-wide">
          <p className="text-sm uppercase tracking-wider text-sky-200">Secure booking</p>
          <h1 className="mt-2 font-heading text-4xl font-bold">Complete your flight booking</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/75">
            {accountState === "checking"
              ? "Checking customer account access..."
              : accountState === "signed_out"
                ? "Sign in to submit this booking request."
                : getApprovalMessage(accountState)}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-6">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index <= step ? "bg-gold text-navy" : "bg-white/10 text-white/50"}`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={index <= step ? "text-white" : "text-white/45"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {step === 0 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-navy">Review flight</h2>
                    <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950">{flight.airline} / {flight.flightNumber}</p>
                          <p className="text-sm text-slate-500">{flight.aircraft}</p>
                        </div>
                        <Badge>{flight.tags[0]}</Badge>
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div><p className="text-2xl font-bold text-navy">{flight.from}</p><p className="text-sm text-slate-500">{formatDateTime(flight.departureTime)}</p></div>
                        <div className="text-center text-sm text-slate-500">{formatDuration(flight.durationMinutes)}<div className="my-2 h-px bg-slate-200" />{flight.stops ? `${flight.stops} stop` : "Direct"}</div>
                        <div className="text-right"><p className="text-2xl font-bold text-navy">{flight.to}</p><p className="text-sm text-slate-500">{formatDateTime(flight.arrivalTime)}</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-navy">Passenger details</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {[
                        ["firstName", "First name"],
                        ["lastName", "Last name"],
                        ["dateOfBirth", "Date of birth"],
                        ["documentNumber", "Passport/CNIC"],
                        ["email", "Email"],
                        ["phone", "Phone"],
                      ].map(([key, label]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>{label}</Label>
                          <Input
                            id={key}
                            type={key === "dateOfBirth" ? "date" : key === "email" ? "email" : "text"}
                            value={String(passenger[key as keyof PassengerDetails] || "")}
                            onChange={(event) => setPassenger({ ...passenger, [key]: event.target.value })}
                          />
                          {errors[key as keyof PassengerDetails] && (
                            <p className="text-xs text-red-600">{errors[key as keyof PassengerDetails]}</p>
                          )}
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={passenger.gender}
                          onChange={(event) => setPassenger({ ...passenger, gender: event.target.value })}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                        >
                          <option value="">Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                        {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-navy">Choose your seat</h2>
                    <p className="mt-1 text-sm text-slate-500">Seat map is scrollable on mobile.</p>
                    <div className="mt-5"><SeatMap selectedSeat={selectedSeat} onSelect={setSelectedSeat} /></div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-navy">Baggage and add-ons</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      {bookingAddOns.map((addOn) => {
                        const active = selectedAddOns.some((item) => item.id === addOn.id);
                        return (
                          <button
                            key={addOn.id}
                            type="button"
                            onClick={() => toggleAddOn(addOn)}
                            className={`rounded-2xl border p-4 text-left transition ${active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
                          >
                            <p className="font-semibold text-navy">{addOn.title}</p>
                            <p className="mt-2 text-sm text-slate-500">{addOn.description}</p>
                            <p className="mt-4 font-bold text-gold">{formatCurrency(addOn.price)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-navy">Submit request</h2>
                    <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                      <div className="mb-4 flex items-center gap-2 text-navy">
                        <Mail className="h-5 w-5" /> Review before sending to Al Qibla
                      </div>
                      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <p><strong className="text-slate-900">Passenger:</strong> {passenger.firstName} {passenger.lastName}</p>
                        <p><strong className="text-slate-900">Phone:</strong> {passenger.phone}</p>
                        <p><strong className="text-slate-900">Seat:</strong> {selectedSeat ? selectedSeat.id : "Not selected"}</p>
                        <p><strong className="text-slate-900">Add-ons:</strong> {selectedAddOns.length || "None"}</p>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">
                        No card is charged online. The request is saved for the team to confirm availability and payment on WhatsApp.
                      </p>
                      {submitError && (
                        <p className="mt-4 flex items-center gap-2 rounded-lg border border-red-accent/30 bg-red-accent/10 px-3 py-2 text-sm text-red-accent">
                          <AlertCircle className="h-4 w-4" /> {submitError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                    >
                      <Check className="h-10 w-10" />
                    </motion.div>
                    <h2 className="mt-5 font-heading text-3xl font-bold text-navy">Request received</h2>
                    <p className="mt-2 text-slate-500">Reference {bookingRef.slice(0, 8).toUpperCase()}</p>
                    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                      <p className="font-semibold text-navy">{passenger.firstName} {passenger.lastName}</p>
                      <p className="text-sm text-slate-500">{flight.from} to {flight.to} / {flight.flightNumber}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                        <Mail className="h-4 w-4" /> Our team will confirm availability and payment.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <a
                        href={whatsappLink(`Hello ${SITE.name}, I submitted flight booking request #${bookingRef.slice(0, 8)} for ${flight.airline} ${flight.flightNumber}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "navy" }))}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> Continue on WhatsApp
                      </a>
                      <Link href="/flight-booking/results/" className={cn(buttonVariants({ variant: "outline" }))}>
                        Search another flight
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {step < 5 && (
              <div className="mt-8 flex justify-between gap-3">
                <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
                  Back
                </Button>
                <Button variant="navy" onClick={next} disabled={processing}>
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === 4 ? "Submit Request" : "Continue"}
                </Button>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-navy">Trip summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span>Base fare</span><strong>{formatCurrency(flight.price)}</strong></div>
              <div className="flex justify-between"><span>Seat</span><strong>{selectedSeat ? `${selectedSeat.id} / ${formatCurrency(selectedSeat.price)}` : "Not selected"}</strong></div>
              <div className="flex justify-between"><span>Add-ons</span><strong>{formatCurrency(selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0))}</strong></div>
              <div className="border-t pt-3 flex justify-between text-base"><span>Total</span><strong className="text-gold">{formatCurrency(total)}</strong></div>
            </div>
            <Link href="/flight-booking/results/" className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:underline">
              Change flight
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

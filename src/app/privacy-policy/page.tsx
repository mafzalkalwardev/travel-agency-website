import Link from "next/link";
import { ArrowLeft, Cookie, Database, Globe2, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { createPageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: `Learn how ${SITE.name} collects, uses, stores and protects personal information submitted through its website and travel services.`,
  path: "/privacy-policy/",
});

const sections = [
  {
    icon: Database,
    title: "Information we collect",
    content: (
      <>
        <p>We may collect information you provide when creating an account, requesting travel services, submitting an inquiry, booking travel or contacting our team. This can include:</p>
        <ul>
          <li>Name, email address, phone or WhatsApp number and postal address.</li>
          <li>Account login information and customer or sub-agent profile details.</li>
          <li>Passenger and travel details such as nationality, date of birth, passport information, preferred airport, route, travel dates and special requests.</li>
          <li>Booking, inquiry, payment-confirmation and customer-support communications.</li>
          <li>Technical information routinely provided by your browser or hosting infrastructure, such as IP address, device type, requested pages and security logs.</li>
        </ul>
      </>
    ),
  },
  {
    icon: UserRoundCheck,
    title: "How we use information",
    content: (
      <>
        <p>We use personal information to provide and improve our travel services, including to:</p>
        <ul>
          <li>Create and secure accounts, review access requests and maintain customer profiles.</li>
          <li>Prepare quotations, process booking or hold requests and coordinate passengers, suppliers and itineraries.</li>
          <li>Respond to inquiries through email, telephone, WhatsApp or our offices.</li>
          <li>Send booking confirmations, operational notices and service-related communications.</li>
          <li>Prevent misuse, investigate technical issues and protect customers, staff and our systems.</li>
          <li>Meet recordkeeping, legal, regulatory, accounting and dispute-resolution obligations.</li>
        </ul>
        <p>We do not sell personal information.</p>
      </>
    ),
  },
  {
    icon: Globe2,
    title: "Service providers and international processing",
    content: (
      <>
        <p>We share information only when reasonably necessary to operate our services or complete a requested journey. Recipients may include airlines, hotels, visa or Umrah service providers, travel inventory suppliers, payment or communication providers and authorized government or regulatory bodies.</p>
        <p>Our website also uses technology providers such as Supabase for authentication and database services, Vercel for website hosting, Resend for transactional email and WhatsApp for customer communications. These providers process information under their own terms and privacy practices, and their systems may operate outside your country.</p>
      </>
    ),
  },
  {
    icon: Cookie,
    title: "Cookies and local storage",
    content: (
      <>
        <p>We use essential cookies and similar browser storage to keep accounts signed in, protect authenticated pages, remember necessary session state and support core website functions. Blocking essential storage may prevent account or booking features from working correctly.</p>
        <p>We do not use this website to sell cross-site advertising profiles.</p>
      </>
    ),
  },
  {
    icon: LockKeyhole,
    title: "Security and retention",
    content: (
      <>
        <p>We use reasonable administrative, technical and organizational safeguards designed to protect personal information. No internet transmission or storage system can be guaranteed completely secure, so customers should avoid sending unnecessary sensitive information through open message fields.</p>
        <p>We retain information for as long as needed to provide requested services, maintain legitimate business and travel records, resolve disputes, prevent fraud and satisfy applicable legal or regulatory duties. Information that is no longer required may be deleted, anonymized or securely archived.</p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Your choices and rights",
    content: (
      <>
        <p>You may contact us to request access to, correction of or deletion of personal information we control. You may also ask questions about how your information is used or withdraw consent where processing relies on consent.</p>
        <p>Some information may need to be retained when required for confirmed travel, financial records, safety, fraud prevention or legal obligations. We may need to verify your identity before completing a privacy request.</p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="relative overflow-hidden bg-[#f4efe7] py-14 sm:py-20">
      <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#0a2342_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -left-28 top-16 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
      <div className="absolute -right-24 bottom-24 h-96 w-96 rounded-full bg-[#6f8f82]/15 blur-3xl" />

      <div className="container-wide relative max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8c5d28] transition hover:text-navy"><ArrowLeft className="h-4 w-4" /> Back to Al Qibla</Link>

        <header className="mt-8 overflow-hidden rounded-[2rem] bg-[#071d38] px-7 py-10 text-white shadow-[0_28px_80px_rgba(7,29,56,.18)] sm:px-12 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-gold-light"><ShieldCheck className="h-4 w-4" /> Your information matters</span>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">This policy explains how {SITE.name} handles information when you use our website, accounts, inquiry forms and travel services.</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[.16em] text-gold-light">Effective July 13, 2026</p>
        </header>

        <div className="mt-8 space-y-5">
          {sections.map(({ icon: Icon, title, content }) => (
            <section key={title} className="rounded-3xl border border-white bg-white/85 p-6 shadow-[0_15px_45px_rgba(25,45,65,.07)] backdrop-blur sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eee1ce] text-[#8c5d28]"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-2xl font-bold text-navy">{title}</h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">{content}</div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-[#d8c7ad] bg-[#eee1ce]/75 p-7 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#8c5d28]">Privacy questions</p><h2 className="mt-2 font-heading text-2xl font-bold text-navy">Contact our team</h2><p className="mt-2 text-sm text-slate-600">We will review privacy requests and respond through an appropriate verified channel.</p></div>
            <a href={`mailto:${SITE.email}?subject=Privacy%20Request`} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-navy px-6 font-semibold text-white transition hover:bg-navy-light"><Mail className="h-4 w-4" /> {SITE.email}</a>
          </div>
        </section>
      </div>
    </main>
  );
}

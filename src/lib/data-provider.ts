import { announcements } from "@/data/announcements";
import { airlines } from "@/data/airlines";
import { blogPosts } from "@/data/blog";
import { buildExploreDestinations } from "@/lib/explore-destinations";
import { flyers } from "@/data/flyers";
import { tourPackages, umrahPackages } from "@/data/packages";
import { galleryImages, services } from "@/data/services";
import { testimonials } from "@/data/testimonials";
import { tickets, ticketsSyncMetadata } from "@/data/tickets";
import { filterTickets } from "@/lib/ticket-filters";
import { isOutboundGroupTicket, isReturnLegExternalId } from "@/lib/airport-codes";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isTravelLineSyncEnabled } from "@/lib/travelline/env";
import { readLocalSyncMeta, readLocalTickets } from "@/lib/sync/local-inventory";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Airline,
  Announcement,
  BlogPost,
  Destination,
  Flyer,
  GalleryItem,
  Review,
  ReviewStats,
  Service,
  SyncMetadata,
  Testimonial,
  Ticket,
  TicketFilters,
  TravelPackage,
} from "@/types";

export interface IDataProvider {
  getAnnouncements(): Promise<Announcement[]>;
  getFlyers(): Promise<Flyer[]>;
  getUmrahPackages(): Promise<TravelPackage[]>;
  getTourPackages(): Promise<TravelPackage[]>;
  getFeaturedUmrahPackages(): Promise<TravelPackage[]>;
  getTickets(filters?: TicketFilters): Promise<Ticket[]>;
  getTicketsSyncMetadata(): Promise<SyncMetadata>;
  getAirlines(): Promise<Airline[]>;
  getDestinations(): Promise<Destination[]>;
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getTestimonials(): Promise<Testimonial[]>;
  getApprovedReviews(): Promise<Review[]>;
  getReviewStats(): Promise<ReviewStats>;
  getServices(): Promise<Service[]>;
  getGalleryImages(): Promise<GalleryItem[]>;
}

function testimonialsToReviews(items: Testimonial[]): Review[] {
  return items.map((t) => ({
    id: t.id,
    name: t.name,
    city: t.location,
    rating: t.rating,
    comment: t.text,
    avatar_url: t.avatar,
    status: "approved" as const,
    featured: false,
    created_at: new Date().toISOString(),
  }));
}

function computeStats(reviews: Review[]): ReviewStats {
  if (!reviews.length) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  }
  return { average: sum / reviews.length, count: reviews.length, distribution };
}

class MockDataProvider implements IDataProvider {
  async getAnnouncements() {
    return announcements.filter((a) => a.active).sort((a, b) => a.priority - b.priority);
  }

  async getFlyers() {
    return flyers.filter((f) => f.active).sort((a, b) => a.order - b.order);
  }

  async getUmrahPackages() {
    return umrahPackages;
  }

  async getTourPackages() {
    return tourPackages;
  }

  async getFeaturedUmrahPackages() {
    return umrahPackages.filter((p) => p.featured);
  }

  async getTickets(filters?: TicketFilters) {
    if (!filters) return tickets;
    return filterTickets(tickets, filters);
  }

  async getTicketsSyncMetadata() {
    return ticketsSyncMetadata;
  }

  async getAirlines() {
    return airlines;
  }

  async getDestinations() {
    const [tickets, packages] = await Promise.all([
      this.getTickets(),
      this.getUmrahPackages(),
    ]);
    return buildExploreDestinations(tickets, packages);
  }

  async getBlogPosts() {
    return blogPosts.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  async getBlogPostBySlug(slug: string) {
    return blogPosts.find((p) => p.slug === slug);
  }

  async getTestimonials() {
    return testimonials;
  }

  async getApprovedReviews() {
    return testimonialsToReviews(testimonials);
  }

  async getReviewStats() {
    return computeStats(await this.getApprovedReviews());
  }

  async getServices() {
    return services;
  }

  async getGalleryImages() {
    return galleryImages;
  }
}

/** Columns needed for public ticket lists — avoid select("*") payload bloat. */
const TICKET_LIST_COLUMNS =
  "id,airline,airline_code,flight_number,from_code,from_city,to_code,to_city,sector,destination,departure_date,departure_time,arrival_time,duration,price,currency,seats_left,status,baggage,meal,trip_type,is_direct,active,last_updated,group_category,aircraft,external_id";

/** Public package cards — omit raw_payload jsonb (large supplier blob). */
const UMRAH_LIST_COLUMNS =
  "id,title,slug,package_code,external_id,category,price,currency,duration,departure_city,airline,hotel_makkah,hotel_madinah,distance_from_haram,transport,visa,ziyarat,seats_left,image_url,featured,status,highlights";

const TOUR_LIST_COLUMNS =
  "id,title,slug,package_code,destination,price,currency,duration,image_url,featured,status,highlights";

const FLYER_LIST_COLUMNS = "id,title,image_url,link_url,link,active,display_order,category";
const ANNOUNCEMENT_LIST_COLUMNS = "id,message,priority,active,starts_at,ends_at";

class SupabaseDataProvider implements IDataProvider {
  private mock = new MockDataProvider();
  private ticketsInflight: Promise<Ticket[]> | null = null;

  async getAnnouncements() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("announcements").select(ANNOUNCEMENT_LIST_COLUMNS).eq("active", true).order("priority");
      if (!data?.length) return this.mock.getAnnouncements();
      return data.map((a) => ({
        id: a.id,
        message: a.message,
        priority: a.priority,
        active: a.active,
        startsAt: a.starts_at,
        endsAt: a.ends_at,
      }));
    } catch {
      return this.mock.getAnnouncements();
    }
  }

  async getFlyers() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("flyers").select(FLYER_LIST_COLUMNS).eq("active", true).order("display_order");
      if (!data?.length) return this.mock.getFlyers();
      return data.map((f) => ({
        id: f.id,
        title: f.title,
        image: f.image_url,
        link: f.link,
        order: f.display_order,
        active: f.active,
        category: f.category,
      }));
    } catch {
      return this.mock.getFlyers();
    }
  }

  async getUmrahPackages() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("umrah_packages").select(UMRAH_LIST_COLUMNS).eq("status", "active");
      if (!data?.length) return isTravelLineSyncEnabled() ? [] : this.mock.getUmrahPackages();
      return data.map(mapUmrahPackage);
    } catch {
      return isTravelLineSyncEnabled() ? [] : this.mock.getUmrahPackages();
    }
  }

  async getTourPackages() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("tour_packages").select(TOUR_LIST_COLUMNS).eq("status", "active");
      if (!data?.length) return this.mock.getTourPackages();
      return data.map(mapTourPackage);
    } catch {
      return this.mock.getTourPackages();
    }
  }

  async getFeaturedUmrahPackages() {
    const all = await this.getUmrahPackages();
    return all.filter((p) => p.featured);
  }

  async getTickets(filters?: TicketFilters) {
    // Deduplicate concurrent unfiltered reads (home used to call this twice per request).
    if (!filters) {
      if (!this.ticketsInflight) {
        this.ticketsInflight = this.loadTickets().finally(() => {
          // Clear on next microtask so this request's callers share one fetch,
          // but the next request does not reuse a stale in-memory promise forever.
          queueMicrotask(() => {
            this.ticketsInflight = null;
          });
        });
      }
      return this.ticketsInflight;
    }

    const all = await this.loadTickets();
    return filterTickets(all, filters);
  }

  private async loadTickets(): Promise<Ticket[]> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tickets")
        .select(TICKET_LIST_COLUMNS)
        .eq("active", true);
      if (!error && data?.length) {
        return filterDisplayableTickets(data.filter(isDisplayableTicket).map(mapTicket));
      }
    } catch {
      /* fallback */
    }

    const local = readLocalTickets();
    if (local.length) {
      const mapped: Ticket[] = local.map((t, i) => ({
        id: t.externalId || String(i),
        airline: t.airline,
        airlineCode: t.airlineCode,
        flightNumber: t.flightNumber,
        from: t.from,
        fromCity: t.fromCity,
        to: t.to,
        toCity: t.toCity,
        sector: t.sector,
        destination: t.destination,
        date: t.date,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        duration: t.duration,
        price: t.price,
        currency: t.currency,
        seatsLeft: t.seatsLeft,
        status: t.status === "booked" ? "sold_out" : t.status,
        baggage: t.baggage,
        meal: t.meal,
        tripType: (t.tripType as Ticket["tripType"]) || "oneway",
        isDirect: t.isDirect,
        groupCategory: t.groupCategory,
        aircraft: t.aircraft,
        refundable: t.refundable,
        changeFeeApplicable: t.changeFeeApplicable,
        groupPnr: t.groupPnr,
        supplierUpdatedAt: t.supplierUpdatedAt,
        segments: t.segments,
        lastUpdated: new Date().toISOString(),
      }));
      return mapped;
    }

    if (isTravelLineSyncEnabled()) {
      return [];
    }

    return this.mock.getTickets();
  }

  async getTicketsSyncMetadata(): Promise<SyncMetadata> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("sync_logs")
        .select("completed_at, provider")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.completed_at) {
        return { lastSyncedAt: data.completed_at, source: data.provider || "database" };
      }
    } catch {
      /* fallback */
    }
    const localMeta = readLocalSyncMeta();
    if (localMeta.ticketsCount > 0) {
      return { lastSyncedAt: localMeta.lastSyncedAt, source: localMeta.source };
    }
    const meta = await this.mock.getTicketsSyncMetadata();
    return { ...meta, source: isTravelLineSyncEnabled() ? "travelline" : meta.source };
  }

  async getAirlines() {
    return this.mock.getAirlines();
  }

  async getDestinations() {
    const [tickets, packages] = await Promise.all([
      this.getTickets(),
      this.getUmrahPackages(),
    ]);
    return buildExploreDestinations(tickets, packages);
  }

  async getBlogPosts() {
    return this.mock.getBlogPosts();
  }

  async getBlogPostBySlug(slug: string) {
    return this.mock.getBlogPostBySlug(slug);
  }

  async getTestimonials() {
    return this.mock.getTestimonials();
  }

  async getApprovedReviews(): Promise<Review[]> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("reviews")
        .select("id,name,city,service,rating,comment,avatar_url,status,featured,created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(24);
      if (!data?.length) return this.mock.getApprovedReviews();
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        service: r.service,
        rating: r.rating,
        comment: r.comment,
        avatar_url: r.avatar_url,
        status: r.status,
        featured: r.featured,
        created_at: r.created_at,
      }));
    } catch {
      return this.mock.getApprovedReviews();
    }
  }

  async getReviewStats() {
    return computeStats(await this.getApprovedReviews());
  }

  async getServices() {
    return this.mock.getServices();
  }

  async getGalleryImages() {
    return this.mock.getGalleryImages();
  }
}

function mapUmrahPackage(row: Record<string, unknown>): TravelPackage {
  // Prefer normalized columns. raw_payload is intentionally not selected on list pages
  // to cut Supabase egress; detail fields fall back to column values only.
  const raw = row.raw_payload as Record<string, unknown> | undefined;
  const hotel = raw?.hotel as Record<string, unknown> | undefined;
  const meters = hotel?.makkahDistanceMeters as number | undefined;
  const distanceFromHaram =
    (row.distance_from_haram as string | undefined) ||
    (hotel?.makkahDistance as string | undefined) ||
    (typeof meters === "number"
      ? meters >= 1000
        ? `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km from Haram`
        : `${meters} m from Haram`
      : undefined);

  const rawHighlights = (row.highlights as string[]) || [];
  const highlights = rawHighlights.filter(
    (h) => !/^makkah:\s*/i.test(h) && !/^madinah:\s*/i.test(h)
  );

  const inclusions = (raw?.inclusions as string[] | undefined) || [];
  const visaFromInclusions = inclusions.some((item) => /visa/i.test(item));

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price),
    currency: String(row.currency || "PKR"),
    duration: String(row.duration),
    highlights: highlights.length ? highlights : inclusions.slice(0, 5),
    image: String(row.image_url || "/assets/gallery/umrah-1.svg"),
    featured: Boolean(row.featured),
    status: row.status as TravelPackage["status"],
    type: "umrah",
    packageCode: (row.package_code || row.external_id) as string,
    category: row.category as TravelPackage["category"],
    departureCity: (row.departure_city || raw?.fromCity) as string,
    airline: (row.airline || raw?.airline) as string,
    hotelMakkah: (row.hotel_makkah || hotel?.makkahName || hotel?.name) as string,
    hotelMadinah: (row.hotel_madinah || hotel?.madinahName) as string,
    distanceFromHaram,
    transport: row.transport !== false,
    visa: Boolean(row.visa) || visaFromInclusions,
    ziyarat: Boolean(row.ziyarat) || Boolean(raw?.ziyaraa),
    seatsLeft: row.seats_left as number,
    departureDate: raw?.departureDate as string | undefined,
    departureTime: raw?.departureTime as string | undefined,
    flightNumber: raw?.departureFlightNo as string | undefined,
    hotelStars: hotel?.rating as number | undefined,
    durationDays: raw?.durationDays as number | undefined,
    durationNights: raw?.durationNights as number | undefined,
    returnFlightNumber: raw?.returnFlightNo as string | undefined,
    returnDate: raw?.returnDate as string | undefined,
    makkahNights: raw?.makkahNights as number | undefined,
    madinahNights: raw?.madinahNights as number | undefined,
    departureBaggage: raw?.departureBaggage as string | undefined,
    shortDescription: raw?.shortDescription as string | undefined,
  };
}

function mapTourPackage(row: Record<string, unknown>): TravelPackage {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price || 0),
    currency: String(row.currency || "PKR"),
    duration: String(row.duration),
    highlights: (row.highlights as string[]) || [],
    image: String(row.image_url || "/assets/gallery/tour-1.svg"),
    featured: Boolean(row.featured),
    status: row.status as TravelPackage["status"],
    type: "tour",
    packageCode: row.package_code as string,
    destination: row.destination as string,
  };
}

function isDisplayableTicket(row: { from_code?: string; to_code?: string; external_id?: string | null }): boolean {
  if (isReturnLegExternalId(row.external_id)) return false;
  const from = String(row.from_code || "");
  const to = String(row.to_code || "");
  if (!from || !to) return false;
  return isOutboundGroupTicket(from, to);
}

function filterDisplayableTickets<T extends Ticket>(tickets: T[]): T[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return tickets.filter((t) => {
    if (!isOutboundGroupTicket(t.from, t.to)) return false;
    // Hide already-departed flights even if a sync race left them active.
    const date = String(t.date || "").slice(0, 10);
    return !date || date >= today;
  });
}

function mapTicket(row: Record<string, unknown>): Ticket {
  const raw = (row.raw_payload || {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    airline: String(row.airline),
    airlineCode: String(row.airline_code),
    flightNumber: String(row.flight_number),
    from: String(row.from_code),
    fromCity: String(row.from_city),
    to: String(row.to_code),
    toCity: String(row.to_city),
    sector: String(row.sector || ""),
    destination: String(row.destination || ""),
    date: String(row.departure_date),
    departureTime: String(row.departure_time || ""),
    arrivalTime: String(row.arrival_time || ""),
    duration: String(row.duration || ""),
    price: Number(row.price),
    currency: String(row.currency),
    seatsLeft: Number(row.seats_left),
    status: row.status as Ticket["status"],
    baggage: row.baggage as string,
    meal: row.meal as string,
    tripType: row.trip_type as Ticket["tripType"],
    isDirect: Boolean(row.is_direct),
    lastUpdated: row.last_updated as string,
    groupCategory: row.group_category as string | undefined,
    aircraft: (row.aircraft || raw.aircraft) as string | undefined,
    refundable: raw.refundable as string | undefined,
    changeFeeApplicable: raw.changeFeeApplicable as string | undefined,
    groupPnr: raw.groupPnr as string | undefined,
    supplierUpdatedAt: raw.supplierUpdatedAt as string | undefined,
    imageUrl: (row.image_url || raw.imageUrl) as string | undefined,
    segments: raw.segments as Ticket["segments"],
  };
}

export const dataProvider: IDataProvider = isSupabaseConfigured() || isTravelLineSyncEnabled()
  ? new SupabaseDataProvider()
  : new MockDataProvider();

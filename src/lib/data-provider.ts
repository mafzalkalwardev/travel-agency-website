import { announcements } from "@/data/announcements";
import { airlines } from "@/data/airlines";
import { blogPosts } from "@/data/blog";
import { destinations } from "@/data/destinations";
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
    return destinations;
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

class SupabaseDataProvider implements IDataProvider {
  private mock = new MockDataProvider();

  async getAnnouncements() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("announcements").select("*").eq("active", true).order("priority");
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
      const { data } = await supabase.from("flyers").select("*").eq("active", true).order("display_order");
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
      const { data } = await supabase.from("umrah_packages").select("*").eq("status", "active");
      if (!data?.length) return this.mock.getUmrahPackages();
      return data.map(mapUmrahPackage);
    } catch {
      return this.mock.getUmrahPackages();
    }
  }

  async getTourPackages() {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("tour_packages").select("*").eq("status", "active");
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
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("tickets").select("*").eq("active", true);
      if (!error && data?.length) {
        const mapped = filterDisplayableTickets(data.filter(isDisplayableTicket).map(mapTicket));
        if (!filters) return mapped;
        return filterTickets(mapped, filters);
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
        lastUpdated: new Date().toISOString(),
      }));
      if (!filters) return mapped;
      return filterTickets(mapped, filters);
    }

    if (isTravelLineSyncEnabled()) {
      return [];
    }

    return this.mock.getTickets(filters);
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
    return this.mock.getDestinations();
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
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
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
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price),
    currency: String(row.currency || "PKR"),
    duration: String(row.duration),
    highlights: (row.highlights as string[]) || [],
    image: String(row.image_url || "/assets/gallery/umrah-1.svg"),
    featured: Boolean(row.featured),
    status: row.status as TravelPackage["status"],
    type: "umrah",
    packageCode: (row.package_code || row.external_id) as string,
    category: row.category as TravelPackage["category"],
    departureCity: row.departure_city as string,
    airline: row.airline as string,
    hotelMakkah: row.hotel_makkah as string,
    hotelMadinah: row.hotel_madinah as string,
    distanceFromHaram: row.distance_from_haram as string,
    transport: Boolean(row.transport),
    visa: Boolean(row.visa),
    ziyarat: Boolean(row.ziyarat),
    seatsLeft: row.seats_left as number,
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
  return tickets.filter((t) => isOutboundGroupTicket(t.from, t.to));
}

function mapTicket(row: Record<string, unknown>): Ticket {
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
  };
}

export const dataProvider: IDataProvider = isSupabaseConfigured()
  ? new SupabaseDataProvider()
  : new MockDataProvider();

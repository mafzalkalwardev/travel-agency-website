export type TicketStatus = "available" | "limited" | "sold_out";
export type PackageStatus = "active" | "sold_out" | "coming_soon";
export type UmrahCategory = "economy" | "standard" | "premium" | "group" | "family" | "corporate";
export type FlyerCategory = "umrah" | "visa" | "tickets" | "tours" | "announcement";
export type GalleryCategory = FlyerCategory | "all";
export type TripType = "umrah" | "oneway" | "return";

export interface Announcement {
  id: string;
  message: string;
  priority: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface Flyer {
  id: string;
  title: string;
  image: string;
  link?: string;
  order: number;
  active: boolean;
  category: FlyerCategory;
}

export interface TravelPackage {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  duration: string;
  hotelStars?: number;
  highlights: string[];
  image: string;
  featured: boolean;
  status: PackageStatus;
  type: "umrah" | "tour";
  packageCode?: string;
  category?: UmrahCategory;
  departureCity?: string;
  airline?: string;
  hotelMakkah?: string;
  hotelMadinah?: string;
  distanceFromHaram?: string;
  transport?: boolean;
  visa?: boolean;
  ziyarat?: boolean;
  seatsLeft?: number;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  flightNumber?: string;
  durationDays?: number;
  durationNights?: number;
}

export interface Ticket {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  sector: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  seatsLeft: number;
  status: TicketStatus;
  baggage?: string;
  meal?: string;
  aircraft?: string;
  notes?: string;
  tripType?: TripType;
  isDirect?: boolean;
  lastUpdated?: string;
  groupCategory?: string;
  refundable?: string;
  changeFeeApplicable?: string;
  groupPnr?: string;
  supplierUpdatedAt?: string;
  segments?: Array<{
    flightNumber: string;
    airline: string;
    airlineCode: string;
    departureAirport: string;
    departureCode: string;
    departureCity: string;
    departureCountry?: string;
    departureTerminal?: string;
    departureDatetime: string;
    arrivalAirport: string;
    arrivalCode: string;
    arrivalCity: string;
    arrivalCountry?: string;
    arrivalTerminal?: string;
    arrivalDatetime: string;
    aircraft?: string;
    meal?: string;
    status?: string;
  }>;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  publishedAt: string;
  author: string;
  tags: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  name: string;
  city?: string;
  service?: string;
  rating: number;
  comment: string;
  avatar_url?: string;
  status: ReviewStatus;
  featured: boolean;
  created_at: string;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export interface Inquiry {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  approved_at?: string | null;
  approved_by?: string | null;
  approval_notes?: string | null;
  nationality?: string | null;
  passport_number?: string | null;
  date_of_birth?: string | null;
  preferred_airport?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Airline {
  code: string;
  name: string;
  logo: string;
  regions: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  slug: string;
  label: string;
  availableCount?: number;
  startingPrice?: number;
  currency?: string;
  href: string;
  subtitle?: string;
  displayOrder?: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

export interface TicketFilters {
  airline?: string;
  sector?: string;
  fromCity?: string;
  toCity?: string;
  destination?: string;
  date?: string;
  maxPrice?: number;
  minPrice?: number;
  minSeats?: number;
  tripType?: TripType | "all";
  isDirect?: boolean;
  sortBy?: "price" | "date" | "seats";
  groupCategory?: string;
  search?: string;
}

export interface UmrahPackageFilters {
  search?: string;
  departureCity?: string;
  airline?: string;
  duration?: string;
  hotelStars?: number;
  sortBy?: "price" | "date" | "seats";
}

export interface SyncMetadata {
  lastSyncedAt: string;
  source: string;
}

export type BookingStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "booking_in_progress"
  | "confirmed"
  | "failed"
  | "cancelled";

export type BookingProductType = "ticket" | "umrah" | "tour";

export type SupplierHoldStatus = "held" | "failed" | "pending";

export interface Booking {
  id: string;
  status: BookingStatus;
  product_type: BookingProductType;
  ticket_id?: string;
  umrah_package_id?: string;
  tour_package_id?: string;
  external_product_id?: string;
  customer_user_id?: string;
  product_title?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  passenger_details: Record<string, unknown>;
  passengers: number;
  quoted_price: number;
  currency: string;
  travelline_booking_ref?: string;
  supplier_hold_status?: SupplierHoldStatus | null;
  supplier_hold_error?: string;
  supplier_hold_attempts?: number;
  notifications_sent_at?: string;
  admin_notes?: string;
  error_message?: string;
  source_page?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: GalleryCategory;
}

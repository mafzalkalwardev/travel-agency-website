import type { CustomerProfile } from "@/types";

export type CustomerApprovalStatus = CustomerProfile["approval_status"];

export function getApprovalMessage(status: CustomerApprovalStatus): string {
  switch (status) {
    case "approved":
      return "Your account is approved and ready for booking.";
    case "rejected":
      return "Your account needs review before you can book. Please contact our team on WhatsApp for help.";
    case "pending":
    default:
      return "Your account is awaiting admin approval. You can update your profile, but booking is disabled for now.";
  }
}

export function canCustomerBook(status: CustomerApprovalStatus | null | undefined): boolean {
  return status === "approved";
}

import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminTourPackagesPage() {
  return <AdminCrudManager title="Tour Packages" description="Manage holiday and tour packages worldwide." table="tour_packages" />;
}

import { AdminCrudManager } from "@/components/admin/AdminCrudManager";

export default function AdminUmrahPackagesPage() {
  return <AdminCrudManager title="Umrah Packages" description="Add, edit, and manage Umrah package inventory." table="umrah_packages" />;
}

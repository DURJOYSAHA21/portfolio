import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin · portfolio",
  robots: { index: false, follow: false },
};

/** The editing dashboard. Static like the rest of the site; it talks to GitHub from the browser. */
export default function AdminPage() {
  return <AdminApp />;
}

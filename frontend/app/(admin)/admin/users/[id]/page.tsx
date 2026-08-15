import type { Metadata } from "next";

import { UserDetailsView } from "@/features/admin/components/users/user-details-view";

export const metadata: Metadata = { title: "User details" };

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailsView userId={id} />;
}

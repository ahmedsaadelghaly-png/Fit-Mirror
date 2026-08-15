import type { Metadata } from "next";

import { UsersListView } from "@/features/admin/components/users/users-list-view";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return <UsersListView />;
}

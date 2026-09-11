import { listUsers } from "@/lib/admin/users";
import { UserList } from "@/components/admin/UserList";

export default async function AdminUsersPage() {
  const { users, nextCursor } = await listUsers({ limit: 20, cursor: null });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Users</h1>
      <UserList initialUsers={users} initialCursor={nextCursor} />
    </div>
  );
}

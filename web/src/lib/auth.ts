import { auth, currentUser } from "@clerk/nextjs/server";

export type UserRole = "subscriber" | "user" | "editor" | "admin";

export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await currentUser();
  if (!user) return null;

  const role =
    (user.publicMetadata.role as UserRole | undefined) ||
    (user.privateMetadata.role as UserRole | undefined) ||
    "subscriber";

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    role,
  };
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthenticated");
  }
  return userId;
}

export function requireRole(user: SessionUser | null, allowed: UserRole[]) {
  if (!user) {
    throw new Error("Unauthenticated");
  }
  if (!allowed.includes(user.role)) {
    throw new Error("Forbidden");
  }
}

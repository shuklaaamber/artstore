// Resets the admin's password. Usage: ADMIN_EMAIL=you@x.com npx tsx scripts/reset-admin-password.ts
// Uses the DB in DATABASE_URL. Generates a random password (or uses ADMIN_PASSWORD) and prints it once.
import "dotenv/config";
import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import { account, session, user } from "@/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const [u] = await db.select().from(user).where(eq(user.email, email));
  if (!u || u.role !== "admin") throw new Error(`No admin user with email ${email}`);
  const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(9).toString("base64url");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const r = await db.update(account).set({ password: await hashPassword(password) })
    .where(and(eq(account.userId, u.id), eq(account.providerId, "credential"))).returning({ id: account.id });
  if (r.length === 0) throw new Error("Admin has no credential account");
  await db.delete(session).where(eq(session.userId, u.id)); // sign out existing sessions
  console.log(`\nAdmin password reset: ${email} / ${password}\n(Change it after signing in; shown only once.)`);
  await pool.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });

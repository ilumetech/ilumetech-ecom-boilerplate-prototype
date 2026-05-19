// Run AFTER migration add_user_model, BEFORE migration drop_user_role.
// Usage: ts-node src/scripts/backfill-users.ts

import { PrismaClient } from '@prisma/client';
import { createClerkClient } from '@clerk/backend';
import type { User as ClerkUser } from '@clerk/backend';

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function fetchAllClerkUsers(): Promise<ClerkUser[]> {
  const collected: ClerkUser[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await clerk.users.getUserList({ limit, offset });
    collected.push(...result.data);
    if (result.data.length < limit) break;
    offset += limit;
  }

  return collected;
}

async function getRoleIdForUser(clerkUserId: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ roleId: string }[]>`
      SELECT "roleId" FROM "UserRole"
      WHERE "clerkUserId" = ${clerkUserId}
      ORDER BY "createdAt" ASC
      LIMIT 1
    `;
    return rows[0]?.roleId ?? null;
  } catch {
    return null;
  }
}

async function upsertClerkUser(
  clerkUser: ClerkUser,
  roleId: string | null,
): Promise<void> {
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );

  const data = {
    email: primaryEmail?.emailAddress ?? '',
    username: clerkUser.username,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    isActive: !clerkUser.banned,
    roleId,
  };

  await prisma.user.upsert({
    where: { id: clerkUser.id },
    update: data,
    create: {
      id: clerkUser.id,
      createdAt: new Date(clerkUser.createdAt),
      ...data,
    },
  });
}

async function main(): Promise<void> {
  console.log('Fetching users from Clerk...');
  const clerkUsers = await fetchAllClerkUsers();
  console.log(`Found ${clerkUsers.length} users. Syncing to Postgres...`);

  let synced = 0;
  for (const clerkUser of clerkUsers) {
    const roleId = await getRoleIdForUser(clerkUser.id);
    await upsertClerkUser(clerkUser, roleId);
    synced++;
    if (synced % 50 === 0)
      console.log(`Progress: ${synced}/${clerkUsers.length}`);
  }

  console.log(`Done. Synced ${synced} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

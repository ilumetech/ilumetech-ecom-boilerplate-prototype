try {
  process.loadEnvFile();
} catch (error) {
  // Ignore error
}

import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const storefrontClerk = createClerkClient({
  secretKey: process.env.STOREFRONT_CLERK_SECRET_KEY!,
});

async function listUsers(name: string, client: any) {
  console.log(`\n--- Users in ${name} ---`);
  try {
    const users = await client.users.getUserList();
    users.data.forEach((u: any) => {
      console.log(`ID: ${u.id}`);
      console.log(`Emails: ${u.emailAddresses.map((e: any) => e.emailAddress).join(', ')}`);
      console.log(`Name: ${u.firstName} ${u.lastName}`);
      console.log('-------------------');
    });
  } catch (err: any) {
    console.error(`Failed to list users for ${name}:`, err.message || err);
  }
}

async function main() {
  await listUsers('API/Admin (settled-oyster)', clerk);
  await listUsers('Storefront (trusty-whippet)', storefrontClerk);
}

main();

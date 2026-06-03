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

async function runClerkOperation<T>(op: (client: any) => Promise<T>): Promise<T> {
  try {
    return await op(clerk);
  } catch (error: any) {
    console.log(`  > Operation on primary Clerk failed: ${error.message || error}`);
    if (process.env.STOREFRONT_CLERK_SECRET_KEY) {
      console.log('  > Retrying operation on storefront Clerk...');
      try {
        return await op(storefrontClerk);
      } catch (storefrontError: any) {
        console.log(`  > Operation on storefront Clerk failed: ${storefrontError.message || storefrontError}`);
      }
    }
    throw error;
  }
}

async function main() {
  console.log('Primary Key starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 12));
  console.log('Storefront Key starts with:', process.env.STOREFRONT_CLERK_SECRET_KEY?.substring(0, 12));

  const customerId = 'user_3EX3RVbNlAqQemZt9gl7LtZiD2I';
  console.log(`\n--- Test 1: Fetching user ${customerId} ---`);
  try {
    const user = await runClerkOperation((client) => client.users.getUser(customerId)) as any;
    console.log('SUCCESS: Retrieved user:', user.id, user.primaryEmailAddressId);
  } catch (err: any) {
    console.error('FAILED Test 1:', err.message || err);
  }
}

main();

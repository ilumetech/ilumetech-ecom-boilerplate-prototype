import { createClerkClient } from '@clerk/backend';

const key1 = 'sk_test_sMuSEeHlDl7XTQiC9bdRUc1j10r4zJbJHWgNedKrsX'; // from api/admin env
const key2 = 'sk_test_2Rw30Kah0BJUoMG8oGWTeQPUVHB19nSu4K0vSce4iw'; // from storefront env
const userId = 'user_3EX3RVbNlAqQemZt9gl7LtZiD2I';

async function testKey(name: string, key: string) {
  console.log(`Testing key: ${name} (${key.substring(0, 12)}...)`);
  const clerk = createClerkClient({ secretKey: key });
  try {
    const user = await clerk.users.getUser(userId);
    console.log(`Success with ${name}! Retrieved user:`, user.id, user.primaryEmailAddressId);
    return true;
  } catch (err: any) {
    console.log(`Failed with ${name}:`, err.message || err);
    return false;
  }
}

async function main() {
  await testKey('API/Admin Key (settled-oyster)', key1);
  await testKey('Storefront Key (trusty-whippet)', key2);
}

main();

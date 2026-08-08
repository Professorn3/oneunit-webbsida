import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  // Create test user
  const testUser = await pb.collection('users').create({
    email: 'testadmin2@test.se',
    password: 'Password123',
    passwordConfirm: 'Password123',
    name: 'Test Admin',
    role: 'admin'
  });
  
  pb.authStore.clear();
  await pb.collection('users').authWithPassword('testadmin2@test.se', 'Password123');
  
  try {
    const apps = await pb.collection('applications').getFullList({ sort: '-created', filter: "status != 'approved'" });
    console.log("Admin user fetch apps with filter count:", apps.length);
  } catch (err) {
    console.error("Fetch failed:", err.data || err.message);
  }
  
  pb.authStore.clear();
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  await pb.collection('users').delete(testUser.id);
}
test();

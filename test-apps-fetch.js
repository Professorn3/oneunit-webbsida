import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  // Create test user
  const testUser = await pb.collection('users').create({
    email: 'testadmin@test.se',
    password: 'Password123',
    passwordConfirm: 'Password123',
    name: 'Test Admin',
    role: 'admin'
  });
  
  // Logout superuser
  pb.authStore.clear();
  
  // Auth as test user
  await pb.collection('users').authWithPassword('testadmin@test.se', 'Password123');
  
  try {
    const apps = await pb.collection('applications').getFullList();
    console.log("Admin user fetch apps count:", apps.length);
  } catch (err) {
    console.error("Fetch failed:", err.data || err.message);
  }
  
  // Cleanup
  pb.authStore.clear();
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  await pb.collection('users').delete(testUser.id);
}
test();

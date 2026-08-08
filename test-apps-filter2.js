import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  const testUser = await pb.collection('users').create({
    email: 'testadmin3@test.se',
    password: 'Password123',
    passwordConfirm: 'Password123',
    name: 'Test Admin',
    role: 'admin'
  });
  
  pb.authStore.clear();
  await pb.collection('users').authWithPassword('testadmin3@test.se', 'Password123');
  
  try {
    const apps = await pb.collection('applications').getFullList({ filter: "status='pending'" });
    console.log("Admin user fetch apps with filter count:", apps.length);
  } catch (err) {
    console.error("Fetch with filter status='pending' failed:", err.data || err.message);
  }

  try {
    const apps2 = await pb.collection('applications').getFullList();
    console.log("Admin user fetch apps WITHOUT filter count:", apps2.length);
  } catch (err) {
    console.error("Fetch WITHOUT filter failed:", err.data || err.message);
  }
  
  pb.authStore.clear();
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  await pb.collection('users').delete(testUser.id);
}
test();

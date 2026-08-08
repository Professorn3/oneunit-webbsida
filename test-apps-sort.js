import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  const testUser = await pb.collection('users').create({
    email: 'testsort@test.se',
    password: 'Password123',
    passwordConfirm: 'Password123',
    name: 'Test Sort',
    role: 'admin'
  });
  
  pb.authStore.clear();
  await pb.collection('users').authWithPassword('testsort@test.se', 'Password123');
  
  try {
    const apps1 = await pb.collection('applications').getFullList({ sort: '-created' });
    console.log("Sort only:", apps1.length);
  } catch(e) { console.error("Sort only failed:", e.data || e.message); }

  try {
    const apps2 = await pb.collection('applications').getFullList({ filter: "status='pending'" });
    console.log("Filter only:", apps2.length);
  } catch(e) { console.error("Filter only failed:", e.data || e.message); }

  try {
    const apps3 = await pb.collection('applications').getFullList({ sort: '-created', filter: "status='pending'" });
    console.log("Sort and Filter:", apps3.length);
  } catch(e) { console.error("Sort and Filter failed:", e.data || e.message); }
  
  pb.authStore.clear();
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  await pb.collection('users').delete(testUser.id);
}
test();

import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  const testUser = await pb.collection('users').create({
    email: 'testall@test.se',
    password: 'Password123',
    passwordConfirm: 'Password123',
    name: 'Test All',
    role: 'admin'
  });
  
  pb.authStore.clear();
  await pb.collection('users').authWithPassword('testall@test.se', 'Password123');
  
  try {
    const apps = await pb.collection('applications').getFullList({ sort: '-created', filter: "status = 'pending'" });
    console.log("Apps:", apps.length);
  } catch(e) { console.error("Apps fetch failed:", e.data || e.message); }

  try {
    const msgs = await pb.collection('contacts').getFullList({ sort: '-created' });
    console.log("Contacts:", msgs.length);
  } catch(e) { console.error("Contacts fetch failed:", e.data || e.message); }

  try {
    const mems = await pb.collection('users').getFullList({ sort: '-created' });
    console.log("Users:", mems.length);
  } catch(e) { console.error("Users fetch failed:", e.data || e.message); }
  
  pb.authStore.clear();
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  await pb.collection('users').delete(testUser.id);
}
test();

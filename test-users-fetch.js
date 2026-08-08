import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  
  // Try fetching as superuser
  const users = await pb.collection('users').getFullList();
  console.log("Superuser fetch count:", users.length);
}
test();

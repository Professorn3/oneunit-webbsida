import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const users = await pb.collection('users').getFullList();
  console.log("Users:", users.map(u => ({ email: u.email, role: u.role, isBanned: u.isBanned })));
}
check();

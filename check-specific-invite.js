import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const invites = await pb.collection('invites').getFullList();
  console.log("Invites:", invites.map(i => ({ email: i.email, id: i.id })));
}
check();

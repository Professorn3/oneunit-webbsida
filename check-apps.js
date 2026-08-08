import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const apps = await pb.collection('applications').getFullList();
  console.log("Totalt antal applications:", apps.length);
  apps.forEach(a => console.log(`- Status: ${a.status}, Name: ${a.name}, email: ${a.email}`));
}
check();

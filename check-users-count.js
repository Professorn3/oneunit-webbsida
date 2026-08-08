import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const users = await pb.collection('users').getFullList();
  console.log("Totalt antal users:", users.length);
  users.forEach(u => {
    console.log(`- Email: ${u.email}, Roll: ${u.role}, Name: ${u.name}`);
  });
}
check();

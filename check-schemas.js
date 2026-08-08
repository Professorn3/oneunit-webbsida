import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const invites = await pb.collections.getOne('invites');
  console.log("Invites fields:", invites.fields.map(f => f.name));
  const users = await pb.collections.getOne('users');
  console.log("Users fields:", users.fields.map(f => f.name));
}
check();

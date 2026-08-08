import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const appColl = await pb.collections.getOne('applications');
  console.log("Applications fields:", appColl.fields.map(f => f.name));
}
check();

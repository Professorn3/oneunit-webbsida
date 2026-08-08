import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const coll = await pb.collections.getOne('users');
  console.log("updateRule:", coll.updateRule);
  console.log("deleteRule:", coll.deleteRule);
}
check();

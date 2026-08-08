import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const coll = await pb.collections.getOne('invites');
  console.log("listRule:", coll.listRule);
  console.log("viewRule:", coll.viewRule);
  console.log("createRule:", coll.createRule);
  console.log("updateRule:", coll.updateRule);
}
check();

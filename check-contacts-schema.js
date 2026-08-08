import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  try {
    const coll = await pb.collections.getOne('contacts');
    console.log("Contacts fields:", coll.fields.map(f => f.name));
  } catch(e) {
    console.error("Contacts error:", e.message);
  }
}
check();

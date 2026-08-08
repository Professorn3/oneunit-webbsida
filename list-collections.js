import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function list() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const cols = await pb.collections.getFullList();
    console.log(cols.map(c => c.name));
  } catch (err) {
    console.error(err);
  }
}
list();

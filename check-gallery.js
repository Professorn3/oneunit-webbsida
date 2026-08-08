import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function check() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const gallery = await pb.collections.getOne('gallery');
  console.log("Gallery fields:", gallery.fields);
  const items = await pb.collection('gallery').getList(1, 1);
  console.log("Gallery item:", items.items[0]);
}
check();

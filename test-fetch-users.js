import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function test() {
  await pb.collection('users').authWithPassword('swedevice@gmail.com', 'Tomi.123'); // An admin account
  const users = await pb.collection('users').getFullList();
  console.log("Fetched users count:", users.length);
}
test();

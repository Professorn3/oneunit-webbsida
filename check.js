import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function check() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const cols = await pb.collections.getFullList();
    console.log(cols.map(c => c.name));
  } catch (error) {
    console.error(error.message);
  }
}

check();

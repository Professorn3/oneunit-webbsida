import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function check() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const records = await pb.collection('merch').getFullList({ sort: '-created' });
    console.log(`Merch items count: ${records.length}`);
  } catch (error) {
    console.error(JSON.stringify(error.data, null, 2));
  }
}

check();

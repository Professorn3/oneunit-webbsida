import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function check() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const users = await pb.collections.getOne('users');
    console.log(users.fields.map(f => ({ name: f.name, type: f.type })));
  } catch (error) {
    console.error(error.message);
  }
}

check();

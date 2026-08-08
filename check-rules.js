import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function check() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const gallery = await pb.collections.getOne('gallery');
    console.log({
      listRule: gallery.listRule,
      viewRule: gallery.viewRule,
      createRule: gallery.createRule,
      updateRule: gallery.updateRule,
      deleteRule: gallery.deleteRule
    });
  } catch (error) {
    console.error(error.message);
  }
}

check();

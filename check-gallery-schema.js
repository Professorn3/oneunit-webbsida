import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function check() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const gallery = await pb.collections.getOne('gallery');
    
    // For pb v0.23+, it uses 'fields' instead of 'schema'
    const fields = gallery.schema || gallery.fields;
    
    const mediaField = fields.find(f => f.name === 'media');
    console.log(JSON.stringify(mediaField, null, 2));
  } catch (error) {
    console.error('Failed:', error.message);
  }
}
check();

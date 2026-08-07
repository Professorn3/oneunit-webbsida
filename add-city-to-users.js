import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    // Check users collection
    const users = await pb.collections.getOne('users');
    const fields = users.schema || users.fields;
    
    const hasCity = fields.some(f => f.name === 'city');
    if (!hasCity) {
      console.log('Adding city field to users collection...');
      if (users.schema) {
        // old PB version
        users.schema.push({ name: 'city', type: 'text', required: false });
      } else {
        // PB v0.23+
        users.fields.push({ name: 'city', type: 'text', required: false });
      }
      await pb.collections.update('users', users);
      console.log('Successfully added city to users collection.');
    } else {
      console.log('City field already exists in users collection.');
    }
  } catch (error) {
    console.error('Failed:', error.message);
  }
}
fix();

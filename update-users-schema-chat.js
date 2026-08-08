import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    const users = await pb.collections.getOne('users');
    const fields = users.schema || users.fields;
    
    const newFields = [
      { name: 'onlineAt', type: 'date', required: false },
      { name: 'lastReadClubChat', type: 'date', required: false },
      { name: 'lastReadAdminChat', type: 'date', required: false }
    ];

    for (const f of newFields) {
      if (!fields.find(field => field.name === f.name)) {
        fields.push(f);
        console.log(`Added ${f.name} to users collection`);
      }
    }
    
    await pb.collections.update('users', users);
    console.log('Successfully updated users schema for chat features!');
  } catch (error) {
    console.error('Failed:', error.data || error.message);
  }
}
fix();

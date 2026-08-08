import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    const merch = await pb.collections.getOne('merch');
    
    // Byt namn på 'name' till 'title'
    const nameField = merch.fields.find(f => f.name === 'name');
    if (nameField) {
      nameField.name = 'title';
    }
    
    // Lägg till 'createdBy' om den saknas
    const hasCreatedBy = merch.fields.find(f => f.name === 'createdBy');
    if (!hasCreatedBy) {
      merch.fields.push({
        system: false,
        name: 'createdBy',
        type: 'text',
        required: false
      });
    }

    await pb.collections.update('merch', merch);
    console.log('Fixed merch collection schema!');
  } catch (error) {
    console.error('Fix failed:', error.data || error.message);
  }
}

fix();

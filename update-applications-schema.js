import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function updateSchemas() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    console.log('Authed as superuser!');

    const appColl = await pb.collections.getOne('applications');
    const existingFields = appColl.fields.map(f => f.name);
    
    const newFields = [
      { name: 'name', type: 'text' },
      { name: 'age', type: 'number' },
      { name: 'city', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'bike', type: 'text' },
      { name: 'experience', type: 'text' },
      { name: 'reason', type: 'text' },
      { name: 'howFound', type: 'text' },
      { name: 'instagram', type: 'text' }
    ];

    for (const field of newFields) {
      if (!existingFields.includes(field.name)) {
        appColl.fields.push({
          name: field.name,
          type: field.type,
          required: false,
          system: false,
          options: field.type === 'text' ? { max: 10000 } : {}
        });
        console.log(`Added field ${field.name}`);
      }
    }

    await pb.collections.update('applications', appColl);
    console.log('Schema uppdaterat!');
  } catch (err) {
    console.error('Kunde inte uppdatera schemas:', err.data || err.message);
  }
}

updateSchemas();

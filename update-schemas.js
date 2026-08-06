import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function updateSchemas() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    console.log('Authed as superuser!');

    // Uppdatera Users
    const usersCollection = await pb.collections.getOne('users');
    const userFields = usersCollection.fields.map(f => f.name);
    
    if (!userFields.includes('instagram')) {
      usersCollection.fields.push({
        name: 'instagram',
        type: 'text',
        required: false,
        system: false,
        options: { max: 255 }
      });
    }
    
    if (!userFields.includes('bike')) {
      usersCollection.fields.push({
        name: 'bike',
        type: 'text',
        required: false,
        system: false,
        options: { max: 255 }
      });
    }
    
    await pb.collections.update('users', usersCollection);
    console.log('Lade till instagram och bike i users!');

    // Uppdatera Invites
    const invitesCollection = await pb.collections.getOne('invites');
    const inviteFields = invitesCollection.fields.map(f => f.name);
    
    if (!inviteFields.includes('name')) {
      invitesCollection.fields.push({
        name: 'name',
        type: 'text',
        required: false,
        system: false,
        options: { max: 255 }
      });
    }
    
    if (!inviteFields.includes('instagram')) {
      invitesCollection.fields.push({
        name: 'instagram',
        type: 'text',
        required: false,
        system: false,
        options: { max: 255 }
      });
    }
    
    if (!inviteFields.includes('bike')) {
      invitesCollection.fields.push({
        name: 'bike',
        type: 'text',
        required: false,
        system: false,
        options: { max: 255 }
      });
    }
    
    await pb.collections.update('invites', invitesCollection);
    console.log('Lade till name, instagram och bike i invites!');

  } catch (error) {
    console.error('Kunde inte uppdatera schemas:', error.data || error.message);
  }
}

updateSchemas();

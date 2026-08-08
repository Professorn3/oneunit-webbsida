import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function fixRequired() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    const appColl = await pb.collections.getOne('applications');
    
    // Set old fields to not required
    const fieldsToUnrequire = ['firstName', 'lastName', 'discord', 'message'];
    let changed = false;

    appColl.fields = appColl.fields.map(field => {
      if (fieldsToUnrequire.includes(field.name) && field.required === true) {
        field.required = false;
        changed = true;
        console.log(`Gjorde fältet ${field.name} valfritt.`);
      }
      return field;
    });

    if (changed) {
      await pb.collections.update('applications', appColl);
      console.log("Databasen uppdaterad!");
    } else {
      console.log("Inga fält behövde uppdateras.");
    }
  } catch (err) {
    console.error("Fel vid uppdatering:", err.data || err.message);
  }
}

fixRequired();

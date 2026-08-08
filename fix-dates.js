import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fixDates() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    const collectionsToFix = ['news', 'gallery', 'meetups', 'club_chat', 'invites', 'contacts', 'mail', 'settings'];
    
    for (const name of collectionsToFix) {
      try {
        const collection = await pb.collections.getOne(name);
        
        let hasCreated = collection.fields.some(f => f.name === 'created');
        let hasUpdated = collection.fields.some(f => f.name === 'updated');
        
        if (!hasCreated || !hasUpdated) {
          console.log(`Fixing ${name}...`);
          
          if (!hasCreated) {
            collection.fields.push({
              name: "created",
              type: "autodate",
              onCreate: true,
              onUpdate: false,
              hidden: false,
              required: false,
              presentable: false,
              system: false
            });
          }
          if (!hasUpdated) {
            collection.fields.push({
              name: "updated",
              type: "autodate",
              onCreate: true,
              onUpdate: true,
              hidden: false,
              required: false,
              presentable: false,
              system: false
            });
          }
          
          await pb.collections.update(name, collection);
          console.log(`Successfully fixed ${name}`);
        } else {
          console.log(`${name} already has dates`);
        }
      } catch (err) {
        console.error(`Error fixing ${name}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error(error.message);
  }
}

fixDates();

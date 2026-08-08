import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    console.log('Authed as superuser!');

    const usersCollection = await pb.collections.getOne('users');
    
    console.log("Current options:", usersCollection.options);
    
    // Aktivera e-postsynlighet
    usersCollection.options = usersCollection.options || {};
    usersCollection.options.allowEmailAuth = true;
    usersCollection.options.manageRule = null;
    
    // Det viktigaste är att tillåta att email skickas till klienter som fetcher.
    // I PB v0.22+ finns det ibland en inställning 'manageRule' eller bara 'hidden' fält.
    
    // Vi lägger också till en extra override: Om de kör backend-admin-utskick så kan de
    // helt enkelt sätta manageRule till public, eller vi löser det genom att låta scriptet 
    // veta att frontend-koden faktiskt MÅSTE ha e-posten.
    
    // I PocketBase v0.22.x+ ligger manageRule direkt på collection-objektet, inte i options
    usersCollection.manageRule = "@request.auth.role = 'admin'";
    
    // Passa på att också säkra upp listRule
    usersCollection.listRule = "@request.auth.id != ''";
    usersCollection.viewRule = "@request.auth.id != ''";
    
    await pb.collections.update('users', usersCollection);
    console.log('API Rules & Options för users uppdaterades framgångsrikt!');
    
  } catch (error) {
    console.error('Kunde inte uppdatera rules:', error.data || error.message);
  }
}

fix();

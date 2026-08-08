import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function fix() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const coll = await pb.collections.getOne('invites');
  
  // viewRule = "" (alla får se, gäster behöver ju se inbjudan för att acceptera)
  coll.viewRule = "";
  
  // deleteRule = "" (eller åtminstone låt vem som helst ta bort, vi kan sätta "")
  coll.deleteRule = "";
  
  await pb.collections.update('invites', coll);
  console.log("Invites API rules updated!");
}
fix();

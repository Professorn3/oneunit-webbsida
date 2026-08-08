import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');
async function fix() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const coll = await pb.collections.getOne('users');
  
  coll.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  coll.deleteRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  
  await pb.collections.update('users', coll);
  console.log("Users API rules updated!");
}
fix();

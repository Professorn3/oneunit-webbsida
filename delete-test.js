import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function cleanTest() {
  await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
  const records = await pb.collection('applications').getList(1, 50, {
    filter: 'name = "Test Testson"'
  });
  
  for (let record of records.items) {
    await pb.collection('applications').delete(record.id);
    console.log(`Raderade test-ansökan ${record.id}`);
  }
}

cleanTest();

import PocketBase from 'pocketbase';
const pb = new PocketBase('http://192.168.1.157:8095');

async function testSubmit() {
  try {
    // Prova att skicka in en test-ansökan UTAN admin-auth (för att simulera en vanlig besökare)
    await pb.collection('applications').create({
      name: 'Test Testson',
      age: "25", // Skickar string, se om det kraschar
      city: 'Stockholm',
      email: 'test@test.se',
      phone: '0701234567',
      bike: 'Yamaha',
      experience: '1-2',
      reason: 'Vill vara med',
      howFound: 'social',
      instagram: 'test',
      status: 'pending'
    });
    console.log("Skapandet lyckades!");
  } catch (err) {
    console.error("Fel vid skapande (inte inloggad):", err.data || err.message);
  }
}

testSubmit();

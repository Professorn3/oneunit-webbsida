import PocketBase from 'pocketbase';
import fs from 'fs';

const pb = new PocketBase('http://192.168.1.157:8095');

async function migrate() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    // Create collection if it doesn't exist
    try {
      const collection = {
        name: 'newsletter_emails',
        type: 'base',
        system: false,
        fields: [
          { name: 'email', type: 'email', required: true }
        ],
        listRule: "@request.auth.role = 'admin'",
        viewRule: "@request.auth.role = 'admin'",
        createRule: "",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'"
      };
      await pb.collections.create(collection);
      console.log('Created newsletter_emails collection');
    } catch (err) {
      if (err.status !== 400) {
        console.error('Error creating collection:', err.message);
      }
    }
    
    // Read emails from file
    const emailsText = fs.readFileSync('emails.txt', 'utf8');
    const emails = emailsText.split('\n').filter(e => e.trim());
    
    for (const email of emails) {
      try {
        await pb.collection('newsletter_emails').create({ email: email.trim() });
        console.log(`Inserted ${email}`);
      } catch (err) {
        console.error(`Failed to insert ${email}:`, err.message);
      }
    }
    
    console.log('Migration complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

migrate();

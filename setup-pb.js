import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function setup() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    console.log('Authed as superuser!');

    const usersCollection = await pb.collections.getOne('users');
    const meetupsCollection = await pb.collections.getOne('meetups');

    const meetupRsvps = {
      name: 'meetup_rsvps',
      type: 'base',
      system: false,
      fields: [
        { name: 'meetupId', type: 'relation', required: true, collectionId: meetupsCollection.id, cascadeDelete: true, minSelect: 1, maxSelect: 1 },
        { name: 'userId', type: 'relation', required: true, collectionId: usersCollection.id, cascadeDelete: true, minSelect: 1, maxSelect: 1 },
        { name: 'status', type: 'select', required: true, maxSelect: 1, values: ["going", "maybe", "not_going"] }
      ],
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = userId",
      deleteRule: "@request.auth.id = userId"
    };

    try {
      await pb.collections.create(meetupRsvps);
      console.log(`Created collection: meetup_rsvps`);
    } catch (err) {
      if (err.status === 400 && err.data?.data?.name?.code === 'validation_not_unique') {
        console.log(`Collection meetup_rsvps already exists, skipping.`);
      } else {
        console.error(`Failed to create meetup_rsvps:`, err.data);
      }
    }

    console.log('Schema setup complete!');
  } catch (error) {
    console.error('Setup failed:', error.data || error.message);
  }
}

setup();

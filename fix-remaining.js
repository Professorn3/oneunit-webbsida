import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    // FIX CLUB_CHAT
    try {
      const clubChat = await pb.collections.getOne('club_chat');
      clubChat.fields = [
        { name: 'text', type: 'text', required: false },
        { name: 'uid', type: 'text', required: false },
        { name: 'email', type: 'text', required: false },
        { name: 'senderName', type: 'text', required: false },
        { name: 'role', type: 'text', required: false },
        { name: 'imageUrl', type: 'file', required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
        { name: 'gifUrl', type: 'url', required: false },
        { name: 'isPoll', type: 'bool', required: false },
        { name: 'question', type: 'text', required: false },
        { name: 'options', type: 'json', required: false },
        { name: 'votedUsers', type: 'json', required: false },
        { name: 'reactions', type: 'json', required: false },
        { name: 'isPinned', type: 'bool', required: false },
        { name: 'deleted', type: 'bool', required: false },
        { name: 'senderEmail', type: 'text', required: false }
      ];
      await pb.collections.update('club_chat', clubChat);
      console.log('Fixed club_chat');
    } catch(e) { console.log('Error fixing club_chat', e.data); }

    // FIX INVITES
    try {
      const invites = await pb.collections.getOne('invites');
      invites.fields = [
        { name: 'email', type: 'text', required: false },
        { name: 'used', type: 'bool', required: false }
      ];
      await pb.collections.update('invites', invites);
      console.log('Fixed invites');
    } catch(e) { console.log('Error fixing invites', e.data); }

    // FIX CONTACTS
    try {
      const contacts = await pb.collections.getOne('contacts');
      contacts.fields = [
        { name: 'name', type: 'text', required: false },
        { name: 'email', type: 'email', required: false },
        { name: 'message', type: 'text', required: false },
        { name: 'status', type: 'text', required: false }
      ];
      await pb.collections.update('contacts', contacts);
      console.log('Fixed contacts');
    } catch(e) { console.log('Error fixing contacts', e.data); }

    // FIX MEETUPS
    try {
      const meetups = await pb.collections.getOne('meetups');
      meetups.fields = [
        { name: 'title', type: 'text', required: false },
        { name: 'description', type: 'editor', required: false },
        { name: 'date', type: 'text', required: false }, // Text instead of Date to avoid parsing issues if React sends weird format
        { name: 'location', type: 'text', required: false },
        { name: 'route', type: 'text', required: false },
        { name: 'attendees', type: 'json', required: false },
        { name: 'createdBy', type: 'text', required: false }
      ];
      await pb.collections.update('meetups', meetups);
      console.log('Fixed meetups');
    } catch(e) { console.log('Error fixing meetups', e.data); }

    // CREATE MAIL
    try {
      const mail = {
        name: 'mail',
        type: 'base',
        system: false,
        fields: [
          { name: 'to', type: 'email', required: false },
          { name: 'subject', type: 'text', required: false },
          { name: 'html', type: 'text', required: false }
        ],
        listRule: "@request.auth.role = 'admin'",
        viewRule: "@request.auth.role = 'admin'",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'"
      };
      await pb.collections.create(mail);
      console.log('Created mail');
    } catch (err) {
      if (err.status === 400 && err.data?.data?.name?.code === 'validation_not_unique') {
        console.log(`Collection mail already exists.`);
      } else {
        console.log('Error creating mail', err.data);
      }
    }

  } catch (error) {
    console.error('Fix failed:', error.message);
  }
}

fix();

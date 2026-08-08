import PocketBase from 'pocketbase';

const pb = new PocketBase('http://192.168.1.157:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    // FIX NEWS
    const news = await pb.collections.getOne('news');
    news.fields = [
      { name: 'title', type: 'text', required: true },
      { name: 'category', type: 'text', required: false },
      { name: 'excerpt', type: 'text', required: false },
      { name: 'content', type: 'editor', required: false },
      { name: 'image', type: 'file', required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { name: 'date', type: 'date', required: false },
      { name: 'author', type: 'text', required: false }
    ];
    await pb.collections.update('news', news);
    console.log('Fixed news');

    // FIX GALLERY
    const gallery = await pb.collections.getOne('gallery');
    gallery.fields = [
      { name: 'title', type: 'text', required: false },
      { name: 'category', type: 'text', required: false },
      { name: 'type', type: 'text', required: false }, // 'image' or 'video'
      { name: 'uploaderEmail', type: 'text', required: false },
      { name: 'uploaderName', type: 'text', required: false },
      { name: 'likeCount', type: 'number', required: false },
      { name: 'media', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 }
    ];
    gallery.updateRule = "@request.auth.role = 'admin' || @request.auth.email = uploaderEmail";
    gallery.deleteRule = "@request.auth.role = 'admin' || @request.auth.email = uploaderEmail";
    await pb.collections.update('gallery', gallery);
    console.log('Fixed gallery');

    // FIX MEETUPS
    const meetups = await pb.collections.getOne('meetups');
    meetups.fields = [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'editor', required: false },
      { name: 'date', type: 'date', required: true },
      { name: 'time', type: 'text', required: false },
      { name: 'location', type: 'text', required: true },
      { name: 'image', type: 'file', required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { name: 'createdBy', type: 'text', required: false }
    ];
    await pb.collections.update('meetups', meetups);
    console.log('Fixed meetups');

  } catch (error) {
    console.error('Fix failed:', error.data || error.message);
  }
}

fix();

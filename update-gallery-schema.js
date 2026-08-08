import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8095');

async function fix() {
  try {
    await pb.admins.authWithPassword('info@oneunit.se', 'Ilkylie7012');
    
    // Check gallery collection
    const gallery = await pb.collections.getOne('gallery');
    const fields = gallery.schema || gallery.fields;
    
    const mediaField = fields.find(f => f.name === 'media');
    if (mediaField) {
      console.log('Old media field:', JSON.stringify(mediaField));
      
      // Update max size to 500MB (524288000)
      mediaField.options = mediaField.options || {};
      mediaField.options.maxSelectSize = 524288000;
      
      // Add more MIME types for videos, specifically Apple quicktime format (.mov)
      const allowedMimes = mediaField.options.mimeTypes || [];
      const newMimes = [
        ...allowedMimes, 
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v', 'video/mpeg'
      ];
      // unique mimes
      mediaField.options.mimeTypes = [...new Set(newMimes)];
      
      await pb.collections.update('gallery', gallery);
      console.log('Successfully updated gallery schema for video upload on iOS!');
    } else {
      console.log('No media field found.');
    }
  } catch (error) {
    console.error('Failed:', error.data || error.message);
  }
}
fix();

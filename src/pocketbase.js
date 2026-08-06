import PocketBase from 'pocketbase';

// Eftersom Nginx proxar allt till PocketBase via /api och /_
const pb = new PocketBase('/');

export default pb;

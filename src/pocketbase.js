import PocketBase from 'pocketbase';

// The URL is dynamically fetched based on the current window origin.
// In dev, vite proxies /api. In prod, Nginx proxies /api.
const pb = new PocketBase(window.location.origin);

export default pb;

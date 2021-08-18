import { MongoClient } from 'mongodb';
import CONFIG from '@/config/config';

// Connecting to the database
const client = (async () => {
  try {
    const client = new MongoClient(`mongodb://${CONFIG.DB_USER}:${CONFIG.DB_PASSWORD}@` +
      `${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}`);
    await client.connect();
    // listen for requests
    console.log('The Conection is Ok');
    return client;
  } catch (err) {
    console.log(`${err} Could not Connect to the Database. Exiting Now...`);
    process.exit();
  }
})();

export default client;

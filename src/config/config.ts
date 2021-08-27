import dotenv from 'dotenv';
dotenv.config();

export default {
  APP: process.env.APP || 'development',
  PORT: process.env.PORT || '3001',

  DB_DIALECT: process.env.DB_DIALECT || 'mongo',
  DB_HOST: process.env.DB_HOST || 'server:port',
  DB_NAME: process.env.DB_NAME || 'database',
  DB_PORT: process.env.DB_PORT || 'port',
  DB_USER: process.env.DB_USER || 'username',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',

  TWILIO_SID: process.env.TWILIO_SID || 'twilioSid',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'twilioAuthToken',
  TWILIO_NUMBER: process.env.TWILIO_NUMBER || '+15555555555',

  BASE_URL: process.env.BASE_URL || 'http://localhost:3001',

  IMDB_CACHE_MAX: process.env.IMDB_CACHE_MAX || 100,
};

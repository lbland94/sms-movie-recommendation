import config from '@/config/config';
import swaggerJSDoc from 'swagger-jsdoc';

export const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMS Movie Recommendations',
      version: '0.1.0',
      description: 'A project to recommend random movies from IMDB watchlists',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
    },
    servers: [
      {
        url: config.BASE_URL,
      },
    ],
  },
  apis: ['./src/**/*.ts'],
};

export const swaggerConfig = swaggerJSDoc(options);

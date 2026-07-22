import swaggerJsdoc from 'swagger-jsdoc';
import { Config } from '../config/Config';
import { SwaggerConfig } from '../config/SwaggerConfig';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: SwaggerConfig.TITLE,
      version: SwaggerConfig.VERSION,
      description: SwaggerConfig.DESCRIPTION,
    },
    servers: [{ url: `http://localhost:${Config.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: SwaggerConfig.API_FILES_GLOB,
};

export const swaggerSpec = swaggerJsdoc(options);

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Class-Spark-Achieve-Certify API',
      version: '1.0.0',
      description: 'API documentation for the Class-Spark-Achieve-Certify educational platform.'
    },
    servers: [
      {
        url: 'http://localhost:5600/api/v1',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

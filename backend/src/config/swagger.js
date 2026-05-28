const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Boresha-Mama API',
      version: '1.0.0',
      description: 'Mobile and Web-Based Maternal Healthcare System for Trans-Nzoia County, Kenya',
    },
    servers: [
      { url: '/api', description: 'API base path' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pregnancy: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            mother_id: { type: 'string', format: 'uuid' },
            lmp_date: { type: 'string', format: 'date' },
            edd_date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['active', 'completed', 'miscarriage', 'ectopic', 'loss'] },
            risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            pregnancy_id: { type: 'string', format: 'uuid' },
            mother_id: { type: 'string', format: 'uuid' },
            facility_id: { type: 'string', format: 'uuid' },
            appointment_date: { type: 'string', format: 'date-time' },
            visit_type: { type: 'string', enum: ['antenatal', 'postnatal', 'follow_up', 'emergency'] },
            status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'missed'] },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone', 'password', 'firstName', 'lastName', 'role'],
                  properties: {
                    phone: { type: 'string', example: '+254712345678' },
                    password: { type: 'string', minLength: 6 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { type: 'string', enum: ['chv', 'facility_staff', 'county_admin'] },
                    nationalId: { type: 'string' },
                    facilityId: { type: 'string', format: 'uuid' },
                    areaOfCoverage: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email/phone and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['identifier', 'password'],
                  properties: {
                    identifier: { type: 'string', example: '+254712345678' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          security: [],
          responses: {
            200: { description: 'Service is healthy' },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
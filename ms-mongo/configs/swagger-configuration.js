'use strict';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexusBank ms-mongo API',
      version: '1.0.0',
      description: 'Documentacion de endpoints de ms-mongo',
      contact: {
        name: 'API Support',
        email: 'support@nexusbank.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3006/api/v1',
        description: 'Seccion Mongo'
      }
    ],
    tags: [
      { name: 'System' },
      { name: 'Catalog' },
      { name: 'Favorites' },
      { name: 'Security' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del login'
        }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            code: { type: 'string', nullable: true, example: null },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object', nullable: true },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string', nullable: true, example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Request validation failed' },
            details: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check del servicio',
          security: [],
          responses: {
            '200': {
              description: 'Servicio saludable',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            }
          }
        }
      },
      '/catalog': {
        get: {
          tags: ['Catalog'],
          summary: 'Listar promociones publicas',
          security: [],
          responses: {
            '200': { description: 'Listado de promociones' }
          }
        }
      },
      '/catalog/{id}': {
        get: {
          tags: ['Catalog'],
          summary: 'Obtener promocion publica por id',
          security: [],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Promocion encontrada' }
          }
        }
      },
      '/catalog/admin/all': {
        get: {
          tags: ['Catalog'],
          summary: 'Listar promociones (admin)',
          responses: {
            '200': { description: 'Listado administrativo' }
          }
        }
      },
      '/catalog/admin/audit/all': {
        get: {
          tags: ['Catalog'],
          summary: 'Listar auditoria de promociones',
          responses: {
            '200': { description: 'Auditoria obtenida' }
          }
        }
      },
      '/catalog/admin/create': {
        post: {
          tags: ['Catalog'],
          summary: 'Crear promocion',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: {
            '201': { description: 'Promocion creada' },
            '400': { description: 'Datos invalidos' }
          }
        }
      },
      '/catalog/admin/{id}/audit': {
        get: {
          tags: ['Catalog'],
          summary: 'Obtener auditoria de promocion',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Auditoria obtenida' }
          }
        }
      },
      '/catalog/admin/{id}/status': {
        put: {
          tags: ['Catalog'],
          summary: 'Actualizar estado de promocion',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Estado actualizado' }
          }
        }
      },
      '/catalog/admin/{id}': {
        put: {
          tags: ['Catalog'],
          summary: 'Actualizar promocion',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: {
            '200': { description: 'Promocion actualizada' }
          }
        },
        delete: {
          tags: ['Catalog'],
          summary: 'Eliminar promocion',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Promocion eliminada' }
          }
        }
      },
      '/favorites': {
        post: {
          tags: ['Favorites'],
          summary: 'Crear favorito',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: {
            '201': { description: 'Favorito creado' }
          }
        },
        get: {
          tags: ['Favorites'],
          summary: 'Listar favoritos',
          responses: {
            '200': { description: 'Favoritos obtenidos' }
          }
        }
      },
      '/favorites/{id}': {
        get: {
          tags: ['Favorites'],
          summary: 'Obtener favorito por id',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Favorito encontrado' }
          }
        },
        put: {
          tags: ['Favorites'],
          summary: 'Actualizar favorito',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          responses: {
            '200': { description: 'Favorito actualizado' }
          }
        },
        delete: {
          tags: ['Favorites'],
          summary: 'Eliminar favorito',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Favorito eliminado' }
          }
        }
      },
      '/security/status': {
        get: {
          tags: ['Security'],
          summary: 'Estado de seguridad del usuario',
          responses: {
            '200': { description: 'Estado obtenido' }
          }
        }
      },
      '/security/failed-attempts': {
        get: {
          tags: ['Security'],
          summary: 'Intentos fallidos del usuario',
          responses: {
            '200': { description: 'Intentos obtenidos' }
          }
        }
      },
      '/security/fraud-alerts': {
        get: {
          tags: ['Security'],
          summary: 'Alertas de fraude del usuario',
          responses: {
            '200': { description: 'Alertas obtenidas' }
          }
        }
      }
    }
  },
  apis: [
    './src/catalog/catalog.routes.js',
    './src/favorite/favorite.routes.js',
    './src/security/security.routes.js'
  ]
};

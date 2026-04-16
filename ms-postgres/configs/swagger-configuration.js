'use strict';

export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NexusBank API',
            version: '1.0.0',
            description: 'API de operaciones bancarias NexusBank',
            contact: {
                name: 'NexusBank Support',
                email: 'support@nexusbank.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/nexusBank/v1',
                description: 'Development server',
                variables: {
                    port: {
                        default: '3000'
                    }
                }
            },
            {
                url: 'https://api.nexusbank.com/nexusBank/v1',
                description: 'Production server'
            }
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
                ErrorResponse: {
                    type: 'object',
                    required: ['success', 'code', 'message', 'timestamp'],
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        code: {
                            type: 'string',
                            example: 'VALIDATION_ERROR'
                        },
                        message: {
                            type: 'string',
                            example: 'Request validation failed'
                        },
                        details: {
                            type: 'string'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    required: ['success', 'code', 'message', 'timestamp'],
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        code: {
                            type: 'string',
                            nullable: true,
                            example: null
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful'
                        },
                        data: {
                            type: 'object'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                DepositRequest: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: 'dep-123456789'
                        },
                        accountId: {
                            type: 'string',
                            example: 'acc-987654321'
                        },
                        amount: {
                            type: 'number',
                            format: 'float',
                            example: 5000
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDIENTE', 'COMPLETADA', 'REVERTIDA'],
                            example: 'PENDIENTE'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        completedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Transfer: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: 'trans-123456789'
                        },
                        sourceAccountId: {
                            type: 'string',
                            example: 'acc-123456789'
                        },
                        destinationAccountId: {
                            type: 'string',
                            example: 'acc-987654321'
                        },
                        amount: {
                            type: 'number',
                            format: 'float',
                            example: 1000
                        },
                        status: {
                            type: 'string',
                            enum: ['COMPLETADA', 'REVERTIDA'],
                            example: 'COMPLETADA'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/auth/auth.routes.js',
        './src/account/account.routes.js',
        './src/deposit/deposit.routes.js',
        './src/transaction/transaction.routes.js',
        './src/user/user.routes.js'
    ]
};

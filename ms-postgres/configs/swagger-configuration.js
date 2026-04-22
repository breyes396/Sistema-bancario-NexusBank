'use strict';

export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NexusBank API',
            version: '1.0.0',
            description: 'Documentacion de endpoints de ms-postgres',
            contact: {
                name: 'API Support',
                email: 'support@nexusbank.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3006/api/v1',
                description: 'Seccion Postgre'
            }
        ],
        tags: [
            { name: 'System' },
            { name: 'Auth' },
            { name: 'Profile' },
            { name: 'Accounts' },
            { name: 'Deposits' },
            { name: 'Transactions' },
            { name: 'Users' }
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
                    required: ['success', 'message'],
                    properties: {
                        success: { type: 'boolean', example: false },
                        code: { type: 'string', nullable: true, example: 'VALIDATION_ERROR' },
                        message: { type: 'string', example: 'Request validation failed' },
                        details: { type: 'string', nullable: true },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    required: ['success', 'message'],
                    properties: {
                        success: { type: 'boolean', example: true },
                        code: { type: 'string', nullable: true, example: null },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object', nullable: true },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'adminb@nexusbank.com' },
                        password: { type: 'string', example: 'ADMINB' }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'name', 'phoneNumber'],
                    properties: {
                        name: { type: 'string', example: 'Cliente Demo' },
                        email: { type: 'string', format: 'email', example: 'cliente.demo@nexusbank.com' },
                        password: { type: 'string', example: 'Cliente123!' },
                        phoneNumber: { type: 'string', example: '55554444' },
                        documentType: { type: 'string', example: 'DPI' },
                        documentNumber: { type: 'string', example: '1234567890123' },
                        income: { type: 'number', example: 8500 }
                    }
                },
                VerifyTokenRequest: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJI...' }
                    }
                },
                ResetPasswordRequest: {
                    type: 'object',
                    required: ['token', 'newPassword'],
                    properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJI...' },
                        newPassword: { type: 'string', example: 'NuevaClave123!' }
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
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login de usuario',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Login exitoso' },
                        '400': { description: 'Credenciales invalidas' }
                    }
                }
            },
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Registro de cliente (Admin/Employee)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RegisterRequest' }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Usuario creado' },
                        '400': { description: 'Datos invalidos' },
                        '401': { description: 'No autenticado' },
                        '403': { description: 'Sin permisos' }
                    }
                }
            },
            '/auth/verify-email': {
                post: {
                    tags: ['Auth'],
                    summary: 'Verificar email con token',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/VerifyTokenRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Email verificado' },
                        '400': { description: 'Token invalido' }
                    }
                },
                get: {
                    tags: ['Auth'],
                    summary: 'Verificar email por query token',
                    security: [],
                    parameters: [
                        {
                            name: 'token',
                            in: 'query',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Email verificado' },
                        '400': { description: 'Token invalido' }
                    }
                }
            },
            '/auth/resend-verification': {
                post: {
                    tags: ['Auth'],
                    summary: 'Reenviar verificacion',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: { type: 'string', format: 'email' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Email reenviado' },
                        '400': { description: 'Email invalido' }
                    }
                }
            },
            '/auth/forgot-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Solicitar recuperacion de password',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: { type: 'string', format: 'email' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Solicitud procesada' }
                    }
                }
            },
            '/auth/reset-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Restablecer password',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Password restablecida' },
                        '400': { description: 'Token o password invalida' }
                    }
                }
            },
            '/auth/profile': {
                get: {
                    tags: ['Auth'],
                    summary: 'Obtener perfil autenticado',
                    responses: {
                        '200': { description: 'Perfil obtenido' },
                        '401': { description: 'No autenticado' }
                    }
                }
            },
            '/profile/edit': {
                put: {
                    tags: ['Profile'],
                    summary: 'Editar perfil propio',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { type: 'object' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Perfil actualizado' },
                        '400': { description: 'Datos invalidos' }
                    }
                }
            },
            '/public/account-requests': {
                post: {
                    tags: ['Accounts'],
                    summary: 'Solicitar cuenta sin token',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['accountType'],
                                    properties: {
                                        accountType: { type: 'string', example: 'ahorro' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Solicitud creada' }
                    }
                }
            },
            '/accounts': {
                get: {
                    tags: ['Accounts'],
                    summary: 'Listar cuentas',
                    responses: {
                        '200': { description: 'Listado de cuentas' }
                    }
                },
                post: {
                    tags: ['Accounts'],
                    summary: 'Crear cuenta (Admin)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        accountType: { type: 'string', example: 'ahorro' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Cuenta creada' },
                        '403': { description: 'Sin permisos' }
                    }
                }
            },
            '/admin/accounts/{id}/enable': {
                post: {
                    tags: ['Accounts'],
                    summary: 'Habilitar cuenta solicitada',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Cuenta habilitada' }
                    }
                }
            },
            '/accounts/{id}/limits': {
                put: {
                    tags: ['Accounts'],
                    summary: 'Actualizar limites de cuenta',
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
                                        perTransactionLimit: { type: 'number' },
                                        dailyTransactionLimit: { type: 'number' },
                                        reason: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Limites actualizados' }
                    }
                }
            },
            '/accounts/{id}/limits/admin': {
                get: {
                    tags: ['Accounts'],
                    summary: 'Ver limites (admin)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Limites obtenidos' }
                    }
                },
                put: {
                    tags: ['Accounts'],
                    summary: 'Actualizar limites (admin)',
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
                                        perTransactionLimit: { type: 'number' },
                                        dailyTransactionLimit: { type: 'number' },
                                        reason: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Limites actualizados' }
                    }
                }
            },
            '/admin/accounts/{accountId}/details': {
                get: {
                    tags: ['Accounts'],
                    summary: 'Detalle de cuenta para admin',
                    parameters: [
                        {
                            name: 'accountId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Detalle de cuenta' }
                    }
                }
            },
            '/my-account/balance/convert': {
                get: {
                    tags: ['Accounts'],
                    summary: 'Convertir saldo',
                    parameters: [
                        {
                            name: 'toCurrency',
                            in: 'query',
                            required: true,
                            schema: { type: 'string', example: 'USD' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Saldo convertido' }
                    }
                }
            },
            '/admin/accounts/{id}/freeze': {
                post: {
                    tags: ['Accounts'],
                    summary: 'Congelar cuenta',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        reason: { type: 'string', example: 'Sospecha de fraude' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Cuenta congelada' }
                    }
                }
            },
            '/admin/accounts/{id}/unfreeze': {
                post: {
                    tags: ['Accounts'],
                    summary: 'Descongelar cuenta',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Cuenta descongelada' }
                    }
                }
            },
            '/admin/accounts/{id}/block-history': {
                get: {
                    tags: ['Accounts'],
                    summary: 'Historial de bloqueos',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Historial obtenido' }
                    }
                }
            },
            '/accounts/deposit-requests': {
                get: {
                    tags: ['Deposits'],
                    summary: 'Listar solicitudes de deposito',
                    responses: {
                        '200': { description: 'Listado obtenido' }
                    }
                },
                post: {
                    tags: ['Deposits'],
                    summary: 'Crear solicitud de deposito',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['destinationAccountNumber', 'amount'],
                                    properties: {
                                        destinationAccountNumber: { type: 'string' },
                                        amount: { type: 'number' },
                                        description: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Solicitud creada' }
                    }
                }
            },
            '/accounts/deposit-requests/{depositId}': {
                get: {
                    tags: ['Deposits'],
                    summary: 'Obtener solicitud de deposito por id',
                    parameters: [
                        {
                            name: 'depositId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Solicitud encontrada' }
                    }
                }
            },
            '/accounts/deposit-requests/{id}/amount': {
                put: {
                    tags: ['Deposits'],
                    summary: 'Actualizar monto de deposito',
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
                                        amount: { type: 'number' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Monto actualizado' }
                    }
                }
            },
            '/accounts/deposit-requests/{id}/approve': {
                put: {
                    tags: ['Deposits'],
                    summary: 'Aprobar deposito',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    requestBody: {
                        required: false,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        couponId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Deposito aprobado' }
                    }
                }
            },
            '/accounts/deposit-requests/{id}/revert': {
                put: {
                    tags: ['Deposits'],
                    summary: 'Revertir deposito',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Deposito revertido' }
                    }
                }
            },
            '/dashboard/transaction-ranking': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Ranking de transacciones (dashboard)',
                    responses: {
                        '200': { description: 'Ranking obtenido' }
                    }
                }
            },
            '/accounts/transfers': {
                post: {
                    tags: ['Transactions'],
                    summary: 'Crear transferencia',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['sourceAccountNumber', 'destinationAccountNumber', 'amount'],
                                    properties: {
                                        sourceAccountNumber: { type: 'string' },
                                        destinationAccountNumber: { type: 'string' },
                                        recipientType: { type: 'string' },
                                        amount: { type: 'number' },
                                        description: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Transferencia creada' }
                    }
                }
            },
            '/accounts/transfers/{transferId}': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Obtener transferencia por id',
                    parameters: [
                        {
                            name: 'transferId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Transferencia encontrada' }
                    }
                }
            },
            '/accounts/transfers/{id}/revert': {
                put: {
                    tags: ['Transactions'],
                    summary: 'Revertir transferencia',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Transferencia revertida' }
                    }
                }
            },
            '/my-account/history': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Historial de cuenta propia',
                    responses: {
                        '200': { description: 'Historial obtenido' }
                    }
                }
            },
            '/client/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Transacciones del cliente autenticado',
                    responses: {
                        '200': { description: 'Listado obtenido' }
                    }
                }
            },
            '/admin/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Transacciones globales para admin',
                    responses: {
                        '200': { description: 'Listado obtenido' }
                    }
                }
            },
            '/employee/accounts/{accountId}/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Transacciones por cuenta para employee',
                    parameters: [
                        {
                            name: 'accountId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Listado obtenido' }
                    }
                }
            },
            '/users': {
                get: {
                    tags: ['Users'],
                    summary: 'Listar usuarios (admin)',
                    responses: {
                        '200': { description: 'Usuarios obtenidos' }
                    }
                }
            },
            '/users/admin/client/{id}/detail': {
                get: {
                    tags: ['Users'],
                    summary: 'Detalle de cliente para admin',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Detalle obtenido' }
                    }
                }
            },
            '/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Obtener usuario por id',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Usuario obtenido' }
                    }
                },
                put: {
                    tags: ['Users'],
                    summary: 'Actualizar usuario por id',
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
                        '200': { description: 'Usuario actualizado' }
                    }
                }
            },
            '/user': {
                get: {
                    tags: ['Users'],
                    summary: 'Alias de /users - listar usuarios',
                    responses: {
                        '200': { description: 'Usuarios obtenidos' }
                    }
                }
            },
            '/user/admin/client/{id}/detail': {
                get: {
                    tags: ['Users'],
                    summary: 'Alias de detalle cliente admin',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Detalle obtenido' }
                    }
                }
            },
            '/user/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Alias de obtener usuario por id',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        '200': { description: 'Usuario obtenido' }
                    }
                },
                put: {
                    tags: ['Users'],
                    summary: 'Alias de actualizar usuario por id',
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
                        '200': { description: 'Usuario actualizado' }
                    }
                }
            }
        }
    },
    apis: [
            './src/auth/auth.routes.js',
            './src/account/account.routes.js',
            './src/deposit/deposit.routes.js',
            './src/transaction/transaction.routes.js',
            './src/user/user.routes.js'
    ]
};

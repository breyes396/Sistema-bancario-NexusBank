/**
 * @fileoverview Rutas para la gestión de productos/servicios bancarios
 * Define todos los endpoints relacionados con crear, actualizar, obtener y cambiar estado de productos
 */

import { Router } from 'express';
import { 
    changeProductStatus, 
    createProduct, 
    getProductById, 
    getProducts, 
    updateProduct,
    getProductsByCategory,
    deleteProduct
} from './product.controller.js';
import { validateCreateProduct, validateProductStatusChange, validateGetProductById, validateUpdateProductRequest } from '../../middlewares/product-validators.js';

/**
 * Instancia del router de Express para gestionar rutas de productos
 * @type {Router}
 */
const router = Router();

/**
 * POST /create
 * Crea un nuevo producto/servicio
 * @middleware validateCreateProduct - Valida los datos del producto (nombre, descripción, precio, categoría)
 * @body {Object} Producto con los datos: nombre, descripción, precio, categoría
 * @returns {Object} Producto creado con ID y metadata
 */
router.post(
    '/create',
    validateCreateProduct,
    createProduct
)

/**
 * GET /get
 * Obtiene todos los productos disponibles
 * @query {number} page - Número de página (por defecto 1)
 * @query {number} limit - Cantidad de registros por página (por defecto 10)
 * @query {boolean} isActive - Filtrar por estado activo/inactivo
 * @query {string} category - Filtrar por categoría (CUENTAS, CREDITOS, INVERSIONES, SEGUROS, TRANSFERENCIAS, ASESORAMIENTO)
 * @returns {Object} Lista de productos con información de paginación
 */
router.get(
    '/get',
    getProducts
)

/**
 * GET /category/:category
 * Obtiene productos filtrados por categoría
 * @param {string} category - Categoría de productos a filtrar
 * @query {number} page - Número de página (por defecto 1)
 * @query {number} limit - Cantidad de registros por página (por defecto 10)
 * @returns {Object} Lista de productos de la categoría especificada con paginación
 */
router.get(
    '/category/:category',
    getProductsByCategory
)

/**
 * GET /:id
 * Obtiene un producto específico por su ID
 * @param {string} id - Identificador único del producto
 * @middleware validateGetProductById - Valida que el ID sea válido
 * @returns {Object} Datos detallados del producto solicitado
 */
router.get('/:id', validateGetProductById, getProductById);

/**
 * PUT /:id
 * Actualiza los datos de un producto existente
 * @param {string} id - Identificador único del producto
 * @middleware validateUpdateProductRequest - Valida los datos a actualizar
 * @body {Object} Datos a actualizar del producto (nombre, descripción, precio, categoría)
 * @returns {Object} Producto actualizado con los nuevos datos
 */
router.put(
    '/:id',
    validateUpdateProductRequest,
    updateProduct
);

/**
 * PUT /:id/activate
 * Activa un producto (cambia su estado a activo)
 * @param {string} id - Identificador único del producto
 * @middleware validateProductStatusChange - Valida que el ID sea válido
 * @returns {Object} Producto con estado actualizado a activo
 */
router.put('/:id/activate', validateProductStatusChange, changeProductStatus);

/**
 * PUT /:id/deactivate
 * Desactiva un producto (cambia su estado a inactivo)
 * @param {string} id - Identificador único del producto
 * @middleware validateProductStatusChange - Valida que el ID sea válido
 * @returns {Object} Producto con estado actualizado a inactivo
 */
router.put('/:id/deactivate', validateProductStatusChange, changeProductStatus);

/**
 * DELETE /:id
 * Elimina un producto de la base de datos
 * @param {string} id - Identificador único del producto
 * @returns {Object} Confirmación de eliminación con datos del producto eliminado
 */
router.delete('/:id', deleteProduct);

/**
 * Exporta el router configurado con todas las rutas
 * @exports router
 */
export default router;

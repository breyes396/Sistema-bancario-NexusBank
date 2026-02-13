import Product from './product.model.js';

/**
 * Crear un nuevo producto
 * @param {Object} req - Solicitud HTTP con datos del producto en req.body
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Producto creado con estado 201 o error con estado 400
 */
export const createProduct = async (req, res) => {
    try {
        // Obtener los datos del producto del cuerpo de la solicitud
        const productData = req.body;

        // Crear instancia del modelo con los datos
        const product = new Product(productData);
        
        // Guardar el producto en la base de datos
        await product.save();

        // Retornar respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product
        })

    } catch (error) {
        // Retornar error si hay problemas de validación
        res.status(400).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        })
    }
}

/**
 * Obtener lista de productos con paginación y filtros
 * @param {Object} req - Solicitud HTTP con parámetros: page, limit, isActive, category
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Lista de productos con información de paginación
 */
export const getProducts = async (req, res) => {

    try {
        // Extraer parámetros de la solicitud (valores por defecto incluidos)
        const { page = 1, limit = 10, isActive = true, category } = req.query;

        // Crear filtro base - solo productos activos
        const filter = { isActive };
        
        // Si se especifica categoría, agregarla al filtro
        if (category) {
            filter.category = category;
        }

        // Configurar opciones de paginación y orden
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Ordenar por fecha más reciente primero
        }

        // Buscar productos con filtro, paginación y orden
        const products = await Product.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);

        // Contar total de productos que coinciden con el filtro
        const total = await Product.countDocuments(filter);

        // Retornar productos con información de paginación
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        })
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: 'Error al obtener los productos',
            error: error.message
        })
    }

}

/**
 * Obtener un producto específico por su ID
 * @param {Object} req - Solicitud HTTP con el ID en req.params.id
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Producto encontrado o error 404 si no existe
 */
export const getProductById = async (req, res) => {
    try {
        // Extraer el ID del producto de los parámetros
        const { id } = req.params;

        // Buscar el producto por ID
        const product = await Product.findById(id);

        // Si no existe el producto, retornar error 404
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
            });
        }

        // Retornar el producto encontrado
        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: 'Error al obtener el producto',
            error: error.message,
        });
    }
};

/**
 * Actualizar un producto existente
 * @param {Object} req - Solicitud HTTP con ID en req.params.id y datos a actualizar en req.body
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Producto actualizado o error si no existe
 */
export const updateProduct = async (req, res) => {
    try {
        // Extraer el ID del producto
        const { id } = req.params;

        // Verificar que el producto existe antes de actualizar
        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado",
            });
        }

        // Preparar los datos a actualizar
        const updateData = { ...req.body };

        // Actualizar el producto y obtener la versión actualizada
        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
            new: true, // Retornar el documento actualizado
            runValidators: true, // Ejecutar validaciones del modelo
        });

        // Retornar producto actualizado
        res.status(200).json({
            success: true,
            message: "Producto actualizado exitosamente",
            data: updatedProduct,
        });
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: "Error al actualizar producto",
            error: error.message,
        });
    }
};

/**
 * Activar o desactivar un producto
 * @param {Object} req - Solicitud HTTP con ID en req.params.id
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Producto actualizado o error si no existe
 * @description La URL debe contener /activate para activar o /deactivate para desactivar
 */
export const changeProductStatus = async (req, res) => {
    try {
        // Extraer el ID del producto
        const { id } = req.params;
        
        // Determinar si es activación o desactivación según la URL
        const isActive = req.url.includes('/activate');
        const action = isActive ? 'activado' : 'desactivado';

        // Actualizar el estado del producto
        const product = await Product.findByIdAndUpdate(
            id,
            { isActive },
            { new: true } // Retornar el documento actualizado
        );

        // Si no existe el producto, retornar error 404
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
            });
        }

        // Retornar producto con estado actualizado
        res.status(200).json({
            success: true,
            message: `Producto ${action} exitosamente`,
            data: product,
        });
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado del producto',
            error: error.message,
        });
    }
};

/**
 * Obtener productos filtrados por categoría
 * @param {Object} req - Solicitud HTTP con categoría en req.params.category y paginación en req.query
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Lista de productos de la categoría especificada
 */
export const getProductsByCategory = async (req, res) => {
    try {
        // Extraer la categoría de los parámetros
        const { category } = req.params;
        
        // Extraer parámetros de paginación
        const { page = 1, limit = 10 } = req.query;

        // Crear filtro: categoría específica y solo productos activos
        const filter = { category, isActive: true };

        // Buscar productos con filtro y paginación
        const products = await Product.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 }); // Ordenar por más reciente primero

        // Contar total de productos en esta categoría
        const total = await Product.countDocuments(filter);

        // Retornar productos con información de paginación
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos por categoría',
            error: error.message,
        });
    }
};

/**
 * Eliminar un producto de la base de datos
 * @param {Object} req - Solicitud HTTP con el ID en req.params.id
 * @param {Object} res - Respuesta HTTP
 * @returns {Object} Producto eliminado o error si no existe
 */
export const deleteProduct = async (req, res) => {
    try {
        // Extraer el ID del producto
        const { id } = req.params;

        // Eliminar el producto por ID
        const product = await Product.findByIdAndDelete(id);

        // Si no existe el producto, retornar error 404
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
            });
        }

        // Retornar confirmación de eliminación
        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente',
            data: product,
        });
    } catch (error) {
        // Retornar error del servidor
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message,
        });
    }
};
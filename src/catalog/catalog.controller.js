'use strict';

import { Catalog } from './catalog.model.js';

export const getAllCatalogItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = category.toUpperCase();
    }
    
    if (search) {
      const { Op } = await import('sequelize');
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const items = await Catalog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'description', 'price', 'pointsCost', 'category', 'imageUrl', 'stock']
    });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error('Error al obtener catálogo:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener el catálogo',
      error: err.message
    });
  }
};

export const getCatalogItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Catalog.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: 'Producto no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener el producto',
      error: err.message
    });
  }
};

export const createCatalogItem = async (req, res) => {
  try {
    const { name, description, price, pointsCost, category, imageUrl, stock } = req.body;
    
    const newItem = await Catalog.create({
      name: name.trim(),
      description: description.trim(),
      price: price || 0,
      pointsCost: pointsCost || 0,
      category: category.toUpperCase(),
      imageUrl,
      stock,
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      msg: 'Producto creado exitosamente',
      data: newItem
    });
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al crear el producto',
      error: err.message
    });
  }
};

export const updateCatalogItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, pointsCost, category, imageUrl, stock, isActive } = req.body;
    
    const item = await Catalog.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: 'Producto no encontrado'
      });
    }
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = price;
    if (pointsCost !== undefined) updateData.pointsCost = pointsCost;
    if (category !== undefined) updateData.category = category.toUpperCase();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (stock !== undefined) updateData.stock = stock;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    await item.update(updateData);
    
    res.status(200).json({
      success: true,
      msg: 'Producto actualizado exitosamente',
      data: item
    });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al actualizar el producto',
      error: err.message
    });
  }
};

export const deleteCatalogItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Catalog.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: 'Producto no encontrado'
      });
    }
    
    await item.update({ isActive: false });
    
    res.status(200).json({
      success: true,
      msg: 'Producto desactivado exitosamente'
    });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al eliminar el producto',
      error: err.message
    });
  }
};

export const getAllCatalogItemsAdmin = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const where = {};
    
    if (category) {
      where.category = category.toUpperCase();
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const items = await Catalog.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error('Error al obtener catálogo completo:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener el catálogo',
      error: err.message
    });
  }
};

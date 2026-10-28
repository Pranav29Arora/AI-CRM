import { dataService } from '../services/data.service.js';

export const getAllProducts = (req, res, next) => {
  try {
    const { search, category } = req.query;
    const products = dataService.getAllProducts({ search, category });
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = (req, res, next) => {
  try {
    const { id } = req.params;
    const product = dataService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${id} not found.`
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, stock, costPrice, absoluteLowerLimit, preferredMinPrice, targetPrice, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Product name is required."
      });
    }

    const newProduct = await dataService.createProduct({
      name,
      sku,
      category,
      stock,
      costPrice,
      absoluteLowerLimit,
      preferredMinPrice,
      targetPrice,
      description
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully in Cloud Firestore.",
      data: newProduct
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateProduct(id, req.body);
    res.json({
      success: true,
      message: "Product updated successfully in Cloud Firestore.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dataService.deleteProduct(id);
    res.json({
      success: true,
      message: "Product deleted successfully from Cloud Firestore.",
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

export const bulkImportProducts = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload. Expected an array of product items in 'items'."
      });
    }

    const result = await dataService.bulkImportProducts(items);
    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${result.createdCount} created, ${result.updatedCount} updated, ${result.errorCount} skipped.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};


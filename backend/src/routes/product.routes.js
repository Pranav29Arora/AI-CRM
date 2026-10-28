import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Products require authentication
router.use(requireAuth);

router.get('/', getAllProducts);
router.post('/bulk', bulkImportProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;


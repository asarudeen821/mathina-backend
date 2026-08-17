import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory,
  updateStock,
  generateQRCode,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.patch('/:id/stock', protect, admin, updateStock);
router.post('/:id/qr-code', protect, admin, generateQRCode);

export default router;

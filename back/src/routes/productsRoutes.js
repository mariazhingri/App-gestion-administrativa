import { Router } from 'express';
import { verificarToken } from '../config/middleware.js';
import productsController from '../controllers/productsController.js';

const router = Router();

router.get('/products/all', verificarToken, productsController.getAllProducts);

export default router;
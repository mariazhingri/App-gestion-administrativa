import { Router } from 'express';
import { verificarToken } from '../config/middleware.js';
import salesController from '../controllers/salesController.js';

const router = Router();

router.get('/sales/all', verificarToken, salesController.getAllSales);
router.get('/sales/:id', verificarToken, salesController.getSaleById);
router.post('/sales', verificarToken, salesController.createSale);

export default router;

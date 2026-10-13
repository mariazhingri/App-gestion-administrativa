import { Router } from 'express';
import { verificarToken } from '../config/middleware.js';
import clientsController from '../controllers/clientsController.js';

const router = Router();

router.get('/clients/all', verificarToken, clientsController.getAllClients);

export default router;
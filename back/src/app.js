import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import clientsRoutes from './routes/clientsRoutes.js';
import ProductsRoutes from './routes/productsRoutes.js';
import salesRoutes from './routes/salesRoutes.js';

const app = express();

app.use((req, res, next) => {
  console.log(`[BACK] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', clientsRoutes);
app.use('/api', ProductsRoutes);
app.use('/api', salesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 Servidor ejecutándose en puerto 3000');
});
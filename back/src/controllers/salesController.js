import SalesService from '../services/salesService.js';

const salesController = {
    async getAllSales(req, res) {
        try {
            const sales = await SalesService.getAllSales();
            return res.status(200).json({ data: sales });
        } catch (error) {
            console.error('Error al consultar las ventas:', error);
            return res.status(500).json({
                message: 'Error interno al consultar las ventas.',
            });
        }
    },

    async getSaleById(req, res) {
        try {
            const sale = await SalesService.getSaleById(Number(req.params.id));
            return res.status(200).json({ data: sale });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    message: error.message,
                });
            }

            console.error('Error al consultar el detalle de la venta:', error);
            return res.status(500).json({
                message: 'Error interno al consultar el detalle de la venta.',
            });
        }
    },

    async deleteSale(req, res) {
        try {
            const sale = await SalesService.deleteSale(Number(req.params.id));
            return res.status(200).json({
                message: 'Venta eliminada correctamente.',
                data: sale,
            });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    message: error.message,
                });
            }

            console.error('Error al eliminar la venta:', error);
            return res.status(500).json({
                message: 'Error interno al eliminar la venta.',
            });
        }
    },

    async createSale(req, res) {
        try {
            const sale = await SalesService.createSale(req.body);

            return res.status(201).json({
                message: 'Venta registrada correctamente',
                data: sale,
            });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    message: error.message,
                });
            }

            console.error('Error al registrar la venta:', error);
            return res.status(500).json({
                message: 'Error interno al registrar la venta.',
            });
        }
    },
};

export default salesController;

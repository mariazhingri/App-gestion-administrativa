import Products from '../models/productsModel.js';

const productsController = {

    async getAllProducts(req, res) {
        try{
            const response = await Products.getAllproducts();

            return res.status(200).json({data: response});
        }catch(error){
            console.error('Error al traer los productos:', error);

            return res.status(500).json({
                message: 'Error interno del servidor'
            });
        }
    }
}

export default productsController;
import Clients from "../models/clientsModel.js";

const clientsController = {

    async getAllClients (req, res){
        try{
            console.log('entro')
            const response = await Clients.getAllClients();

            return res.status(200).json({data: response});
        }catch (error) {
            console.error('Error al traer los clientes:', error);

            return res.status(500).json({
            message: 'Error interno del servidor'
            });
        }
    }
}

export default clientsController;

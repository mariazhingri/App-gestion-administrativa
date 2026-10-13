import prisma from "../config/database.js";

const Clients = {
    async getAllClients() {
        return await prisma.clientes.findMany({
            orderBy: {
                id: "desc",
            },
        });
    },

    async getClientById(id) {
        return await prisma.clientes.findUnique({
            where: { id: Number(id) },
        });
    },

}

export default Clients;
import prisma from "../config/database.js";

const Products = {
    async getAllproducts() {
        return await prisma.productos.findMany({
            orderBy: {
                id: "desc",
            },
        });
    },

    async getProductById(id) {
        return await prisma.productos.findUnique({
            where: { id: Number(id) },
        });
    },

}

export default Products;
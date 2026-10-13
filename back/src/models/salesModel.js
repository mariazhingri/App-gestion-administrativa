import prisma from "../config/database.js";

const Sales = {
    async getAllSales() {
        return prisma.ventas.findMany({
            orderBy: [
                { fecha_emision: "desc" },
                // { id: "desc" },
            ],
            include: {
                clientes: {
                    select: { id: true, nombre_completo: true },
                },
            },
        });
    },

    async getSaleById(id) {
        return prisma.ventas.findUnique({
            where: { id },
            include: {
                clientes: {
                    select: { id: true, nombre_completo: true },
                },
                venta_detalle: {
                    orderBy: { id: "asc" },
                    include: {
                        productos: {
                            select: {
                                id: true,
                                nombre: true,
                                tipo: true,
                                imagen: true,
                                categorias: { select: { nombre: true } },
                            },
                        },
                    },
                },
            },
        });
    },

    async getClientById(id) {
        return prisma.clientes.findUnique({
            where: { id },
            select: { id: true },
        });
    },

    async getProductsByIds(ids) {
        return prisma.productos.findMany({
            where: { id: { in: ids } },
            select: { id: true, nombre: true, precio: true, costo: true },
        });
    },

    async createSale(data) {
        return prisma.ventas.create({
            data: {
                ...data,
                venta_detalle: {
                    create: data.venta_detalle,
                },
            },
            select: { id: true },
        });
    },
};

export default Sales;

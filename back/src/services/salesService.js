import Sales from "../models/salesModel.js";

const ALLOWED_TAX_RATES = [0, 12, 13, 15];

function createRequestError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getGuayaquilDateTime() {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en", {
            timeZone: "America/Guayaquil",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
    );

    return new Date(Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
    ));
}

function parseSaleDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw createRequestError("La fecha de emisión debe tener el formato AAAA-MM-DD.");
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw createRequestError("La fecha de emisión no es válida.");
    }

    return date;
}

const SalesService = {
    getAllSales() {
        return Sales.getAllSales();
    },

    async getSaleById(id) {
        if (!Number.isSafeInteger(id) || id <= 0) {
            throw createRequestError("El identificador de venta no es válido.");
        }

        const sale = await Sales.getSaleById(id);
        if (!sale) {
            throw createRequestError("No se encontró la venta solicitada.", 404);
        }

        return sale;
    },

    async deleteSale(id) {
        if (!Number.isSafeInteger(id) || id <= 0) {
            throw createRequestError("El identificador de venta no es válido.");
        }

        const sale = await Sales.deleteSale(id);
        if (!sale) {
            throw createRequestError("No se encontró la venta solicitada.", 404);
        }

        return sale;
    },

    async createSale(input) {
        const {
            cliente_id,
            fecha_emision,
            observacion,
            descuento_porcentaje,
            iva_porcentaje,
            productos,
        } = input ?? {};

        if (observacion !== undefined && observacion !== null
            && (typeof observacion !== "string" || observacion.length > 250)) {
            throw createRequestError("La observación debe tener como máximo 250 caracteres.");
        }

        const saleDate = parseSaleDate(fecha_emision);
        const saleInputByProduct = new Map();
        for (const item of productos) {
            if (!Number.isSafeInteger(item?.producto_id) || item.producto_id <= 0
                || !Number.isSafeInteger(item?.cantidad) || item.cantidad <= 0
                || typeof item?.costo_unitario !== "number"
                || !Number.isFinite(item.costo_unitario)
                || item.costo_unitario < 0) {
                throw createRequestError("Los productos, cantidades y costos deben ser válidos.");
            }

            const submittedCost = roundMoney(item.costo_unitario);
            const existingItem = saleInputByProduct.get(item.producto_id);
            if (existingItem && existingItem.costo_unitario !== submittedCost) {
                throw createRequestError("El costo de un producto no puede variar dentro de la venta.");
            }

            saleInputByProduct.set(
                item.producto_id,
                {
                    cantidad: (existingItem?.cantidad ?? 0) + item.cantidad,
                    costo_unitario: submittedCost,
                },
            );
        }

        const client = await Sales.getClientById(cliente_id);
        if (!client) {
            throw createRequestError("El cliente seleccionado ya no existe.", 404);
        }

        const databaseProducts = await Sales.getProductsByIds([...saleInputByProduct.keys()]);
        if (databaseProducts.length !== saleInputByProduct.size) {
            throw createRequestError("Uno o más productos seleccionados ya no existen.", 404);
        }

        const saleLines = databaseProducts.map((product) => {
            // if (product.precio === null) {
            //     throw createRequestError("Todos los productos deben tener un precio definido.");
            // }

            const saleInput = saleInputByProduct.get(product.id);
            const price = Number(product.precio);
            // const databaseCost = roundMoney(Number(product.costo));
            // if (saleInput.costo_unitario !== databaseCost) {
            //     throw createRequestError(
            //         `El costo de "${product.nombre}" cambió. Vuelve a cargar los productos.`,
            //         409,
            //     );
            // }

            const quantity = saleInput.cantidad;
            const unitCost = saleInput.costo_unitario;
            const lineSubtotal = roundMoney(price * quantity);

            return {
                producto_id: product.id,
                cantidad: quantity,
                precio: price,
                costo_unitario: unitCost,
                subtotal: lineSubtotal,
                costo_total: roundMoney(unitCost * quantity),
            };
        });

        const subtotal = roundMoney(
            saleLines.reduce((sum, line) => sum + line.subtotal, 0),
        );
        const descuentoValor = roundMoney(subtotal * descuento_porcentaje / 100);
        const baseImponible = roundMoney(subtotal - descuentoValor);
        const iva = roundMoney(baseImponible * iva_porcentaje / 100);
        const total = roundMoney(baseImponible + iva);
        const costoTotal = roundMoney(
            saleLines.reduce((sum, line) => sum + line.costo_total, 0),
        );
        let ivaAsignado = 0;
        const saleDetails = saleLines.map((line, index) => {
            const lineIva = index === saleLines.length - 1
                ? roundMoney(iva - ivaAsignado)
                : roundMoney(subtotal > 0 ? (line.subtotal / subtotal) * iva : 0);
            ivaAsignado = roundMoney(ivaAsignado + lineIva);

            return {
                ...line,
                iva: lineIva,
                status: "A",
            };
        });

        return Sales.createSale({
            cliente_id,
            fecha_emision: saleDate,
            fecha_registro: getGuayaquilDateTime(),
            observacion: typeof observacion === "string" ? observacion.trim() || null : null,
            subtotal,
            descuento_porcentaje,
            descuento_valor: descuentoValor,
            iva,
            total,
            costo_total: costoTotal,
            status: "A",
            venta_detalle: saleDetails,
        });
    },
};

export default SalesService;
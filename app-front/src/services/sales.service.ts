import API_URL from '../config/api';
import { getAuthorizationHeader } from './auth.service';
import type { ApiResponse } from '../types/response';

export type CreateSaleInput = {
  cliente_id: number;
  fecha_emision: string;
  observacion?: string | null;
  descuento_porcentaje: number;
  iva_porcentaje: number;
  productos: {
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
  }[];
};

export type SaleListItem = {
  id: number;
  cliente_id: number;
  fecha_emision: string;
  subtotal: number | string;
  descuento_porcentaje: number;
  descuento_valor: number | string;
  iva: number | string;
  total: number | string;
  costo_total: number | string;
  observacion: string | null;
  status: 'A' | 'I' | 'E';
  fecha_registro: string;
  clientes: {
    id: number;
    nombre_completo: string;
  };
};

export type SaleDetail = SaleListItem & {
  venta_detalle: {
    id: number;
    producto_id: number;
    cantidad: number | string;
    precio: number | string;
    costo_unitario: number | string;
    iva: number | string;
    subtotal: number | string;
    costo_total: number | string;
    productos: {
      id: number;
      nombre: string;
      tipo: string;
      imagen: string | null;
      categorias: { nombre: string } | null;
    };
  }[];
};

type CreateSaleResponse = {
  message?: string;
  data?: {
    id: number;
  };
};

async function salesRequest<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new Error('La URL del backend no está configurada.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: await getAuthorizationHeader(),
  });
  const result: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error( 'No se pudieron consultar las ventas.');
  }
  if (result.data === undefined) {
    throw new Error('El backend no devolvió los datos de ventas.');
  }

  return result.data;
}
export const getAllSales = async ():  Promise<SaleListItem[]> =>{

  const response = await fetch(`${API_URL}/sales/all`, {
    headers: await getAuthorizationHeader(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener las ventas");
  }
  const resultado: ApiResponse<SaleListItem[]> = await response.json();

  return resultado.data;

}

export function getSaleById(id: number): Promise<SaleDetail> {
  return salesRequest<SaleDetail>(`/sales/${id}`);
}

export async function createSale(input: CreateSaleInput): Promise<{ id: number }> {
  if (!API_URL) {
    throw new Error('La URL del backend no está configurada.');
  }

  const response = await fetch(`${API_URL}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthorizationHeader()),
    },
    body: JSON.stringify(input),
  });
  const result: CreateSaleResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? 'No se pudo guardar la venta.');
  }
  if (!result.data || typeof result.data.id !== 'number') {
    throw new Error('El backend no devolvió la venta guardada.');
  }

  return result.data;
}

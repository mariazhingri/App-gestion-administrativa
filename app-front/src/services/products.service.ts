import API_URL from '../config/api';
import type { Producto } from '../types/product';
import type { ApiResponse } from '../types/response';
import { getAuthorizationHeader } from './auth.service';

export const getAllProducts = async (): Promise<Producto[]> => {
  const response = await fetch(`${API_URL}/products/all`, {
    headers: await getAuthorizationHeader(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener los productos");
  }

  const resultado: ApiResponse<Producto[]> = await response.json();

  return resultado.data;
};
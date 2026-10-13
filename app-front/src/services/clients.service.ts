import API_URL from '../config/api';
import type { Client, ClientResponse } from '../types/client';
import { getAuthorizationHeader } from './auth.service';

export const getAllClients = async (): Promise<Client[]> => {
  console.log('Consultando clientes en el backend');
  const response = await fetch(`${API_URL}/clients/all`, {
    headers: await getAuthorizationHeader(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener los clientes");
  }

  const resultado: ClientResponse = await response.json();

  return resultado.data;
};

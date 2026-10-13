export interface Client {
  id: number;
  nombre_completo: string;
  correo: string;
  celular: string | null;
  direccion: string;
  provincia: string;
  canton: string;
}

export interface ClientResponse {
  data: Client[];
}
export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  tipo: string;
  precio: number | null;
  costo: number;
  porcentaje_ganancia: number;
  fecha_emision: Date;
  imagen?: string | null;
}
export interface Usuario {
  id: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  fecha_nacimiento: string;
  estado: string;
  created_at: string;
}

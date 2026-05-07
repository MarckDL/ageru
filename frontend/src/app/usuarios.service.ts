import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/usuarios';

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }
}


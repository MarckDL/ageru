import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RucService {
  private apiUrl = 'http://localhost:3000/comercios';

  constructor(private http: HttpClient) {}

  validarRUC(ruc: string) {
    return this.http.get(`${this.apiUrl}/validar-ruc/${ruc}`);
  }
}


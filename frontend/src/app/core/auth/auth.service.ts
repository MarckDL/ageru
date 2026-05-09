import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: 'user' | 'admin';
  };
}

export interface RegisterPayload {
  username: string;
  password: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email?: string;
  fechaNacimiento: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'ageru_token';
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  readonly isAuthenticated = signal<boolean>(this.hasToken());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          this.isAuthenticated.set(true);
        })
      );
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, payload);
  }

  logout(): Observable<void> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        localStorage.removeItem(this.tokenKey);
        this.isAuthenticated.set(false);
      })
    );
  }

  checkSession(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticated.set(false);
      return of(false);
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/me`, { headers }).pipe(
      map(() => true),
      tap({
        next: () => this.isAuthenticated.set(true),
        error: () => {
          localStorage.removeItem(this.tokenKey);
          this.isAuthenticated.set(false);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}

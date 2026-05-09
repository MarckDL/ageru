import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  usuarioId: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
}

interface LoginResponse {
  token: string;
  user: UserInfo;
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
  private readonly userKey = 'ageru_user';
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
  readonly isAuthenticated = signal<boolean>(this.hasToken());
  readonly currentUser = signal<UserInfo | null>(this.getSavedUser());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.isAuthenticated.set(true);
          this.currentUser.set(response.user);
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
        localStorage.removeItem(this.userKey);
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
      })
    );
  }

  checkSession(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
      return of(false);
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<{ user: UserInfo }>(`${this.apiUrl}/me`, { headers }).pipe(
      map((res) => {
        this.currentUser.set(res.user);
        return true;
      }),
      tap({
        next: () => this.isAuthenticated.set(true),
        error: () => {
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.userKey);
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private getSavedUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

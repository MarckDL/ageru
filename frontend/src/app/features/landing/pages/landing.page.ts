import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <main class="page">
      <section class="hero">
        <h1>Ageru - Plataforma de Pagos</h1>
        <p>
          Queremos construir una plataforma segura y simple para gestionar usuarios,
          pagos y reportes, con una experiencia clara para el cliente y una base
          tecnica escalable para el equipo.
        </p>
        <a class="cta" routerLink="/login">Iniciar sesion</a>
      </section>

      <section class="goals">
        <h2>Que buscamos lograr</h2>
        <ul>
          <li>Autenticacion y autorizacion seguras.</li>
          <li>Dashboard con metricas clave del negocio.</li>
          <li>Modulos separados por features para crecer sin desorden.</li>
          <li>Backend por capas para mantener codigo limpio.</li>
        </ul>
      </section>

      <section class="quick-links">
        <h2>Navegacion rapida</h2>
        <nav>
          <a routerLink="/login">Login</a>
          <a routerLink="/dashboard">Dashboard (protegido)</a>
          <a routerLink="/usuarios">Usuarios</a>
        </nav>
      </section>
    </main>
  `,
  styles: [
    `
      .page { max-width: 900px; margin: 0 auto; padding: 2rem 1rem 3rem; display: grid; gap: 1.5rem; }
      .hero, .goals, .quick-links { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.9rem; padding: 1.2rem; }
      h1 { margin: 0 0 0.7rem; font-size: 1.8rem; }
      h2 { margin: 0 0 0.6rem; font-size: 1.15rem; }
      p { margin: 0 0 0.8rem; color: #334155; line-height: 1.5; }
      ul { margin: 0; padding-left: 1.2rem; color: #334155; }
      li { margin: 0.25rem 0; }
      .cta { display: inline-block; padding: 0.55rem 0.8rem; border-radius: 0.55rem; background: #2563eb; color: #fff; text-decoration: none; }
      nav { display: flex; gap: 0.7rem; flex-wrap: wrap; }
      nav a { color: #1d4ed8; text-decoration: none; }
    `
  ]
})
export class LandingPage {}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppIconComponent } from '../../../shared/components/app-icon.component';

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink, AppIconComponent],
  template: `
    <div class="landing">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-brand">
          <app-icon name="zap" [size]="24" className="logo-icon" />
          <span class="logo-text">Ageru</span>
        </div>
        <div class="nav-links">
          <a routerLink="/login" class="nav-link">Iniciar Sesión</a>
          <a routerLink="/login" class="btn-primary-sm">Comenzar</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-bg-orb orb-1"></div>
        <div class="hero-bg-orb orb-2"></div>
        <div class="hero-content">
          <span class="hero-badge"><app-icon name="rocket" [size]="16" /> Plataforma Fintech para Comercios</span>
          <h1 class="hero-title">
            Pagos digitales
            <span class="gradient-text">simples y seguros</span>
            para tu negocio
          </h1>
          <p class="hero-description">
            Genera cobros mediante códigos QR y enlaces de pago. Gestiona tu negocio
            con dashboards interactivos y transacciones en tiempo real.
          </p>
          <div class="hero-actions">
            <a routerLink="/login" class="btn-primary">
              <span>Crear cuenta gratis</span>
              <app-icon name="arrow-right" [size]="18" className="btn-arrow" />
            </a>
            <a href="#features" class="btn-ghost">Ver características</a>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-value">< 200ms</span>
              <span class="stat-label">Tiempo de respuesta</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">100%</span>
              <span class="stat-label">Seguro con JWT</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">QR</span>
              <span class="stat-label">Cobros instantáneos</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features" id="features">
        <h2 class="section-title">
          Todo lo que necesitas para
          <span class="gradient-text">cobrar digitalmente</span>
        </h2>
        <div class="features-grid">
          <div class="feature-card">
            <app-icon name="lock" [size]="32" className="feature-icon" />
            <h3>Autenticación Segura</h3>
            <p>Protección con JWT para cada sesión. Middleware de seguridad en cada operación financiera.</p>
          </div>
          <div class="feature-card">
            <app-icon name="qr-code" [size]="32" className="feature-icon" />
            <h3>Pagos QR</h3>
            <p>Genera códigos QR fijos o abiertos. Tus clientes pagan escaneando desde su celular.</p>
          </div>
          <div class="feature-card">
            <app-icon name="banknote" [size]="32" className="feature-icon" />
            <h3>Transferencias</h3>
            <p>Envía y recibe dinero entre cuentas con precisión BIGINT. Sin errores de redondeo.</p>
          </div>
          <div class="feature-card">
            <app-icon name="bar-chart" [size]="32" className="feature-icon" />
            <h3>Dashboard Interactivo</h3>
            <p>Visualiza tus transacciones con gráficos Highcharts en tiempo real.</p>
          </div>
          <div class="feature-card">
            <app-icon name="store" [size]="32" className="feature-icon" />
            <h3>Gestión de Comercios</h3>
            <p>Registra tu negocio con RUC, categoría y genera tu QR permanente del local.</p>
          </div>
          <div class="feature-card">
            <app-icon name="refresh-cw" [size]="32" className="feature-icon" />
            <h3>Trazabilidad Total</h3>
            <p>Cada operación queda registrada con timestamp UTC y referencia única.</p>
          </div>
        </div>
      </section>

      <!-- Tech Stack -->
      <section class="tech-section">
        <h2 class="section-title">Construido con tecnología
          <span class="gradient-text">de vanguardia</span>
        </h2>
        <div class="tech-grid">
          <div class="tech-item">
            <span class="tech-name">Angular</span>
            <span class="tech-desc">Frontend SPA</span>
          </div>
          <div class="tech-item">
            <span class="tech-name">Node.js</span>
            <span class="tech-desc">API REST</span>
          </div>
          <div class="tech-item">
            <span class="tech-name">SQL Server</span>
            <span class="tech-desc">Base de datos</span>
          </div>
          <div class="tech-item">
            <span class="tech-name">JWT</span>
            <span class="tech-desc">Seguridad</span>
          </div>
          <div class="tech-item">
            <span class="tech-name">Highcharts</span>
            <span class="tech-desc">Visualización</span>
          </div>
          <div class="tech-item">
            <span class="tech-name">Express</span>
            <span class="tech-desc">Servidor</span>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-card">
          <h2>¿Listo para transformar tu negocio?</h2>
          <p>Empieza a cobrar digitalmente en minutos. Sin costos ocultos.</p>
          <a routerLink="/login" class="btn-primary btn-lg">
            <span>Comenzar ahora</span>
            <app-icon name="arrow-right" [size]="18" className="btn-arrow" />
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-brand">
            <app-icon name="zap" [size]="20" className="logo-icon" />
            <span class="logo-text">Ageru</span>
          </div>
          <p class="footer-text">
            Proyecto académico — Seminario I · Escuela Superior Tecnológica · Lima, 2026
          </p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100dvh;
      overflow-x: hidden;
    }

    /* ── Navbar ── */
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.6s ease;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo-icon {
      color: var(--primary-500);
    }
    .logo-text {
      font-size: 1.4rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-500), #ffffff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .nav-link {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: color var(--transition-fast);
    }
    .nav-link:hover {
      color: var(--text-primary);
    }
    .btn-primary-sm {
      padding: 0.5rem 1.2rem;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
      color: #000000;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      transition: all var(--transition-fast);
    }
    .btn-primary-sm:hover {
      background: linear-gradient(135deg, var(--primary-400), var(--primary-300));
      box-shadow: var(--shadow-glow);
      color: #000000;
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 2rem 3rem;
      text-align: center;
    }
    .hero-bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
      pointer-events: none;
    }
    .orb-1 {
      width: 400px;
      height: 400px;
      background: var(--primary-600);
      top: -100px;
      right: -100px;
      animation: float 8s ease-in-out infinite;
    }
    .orb-2 {
      width: 300px;
      height: 300px;
      background: var(--primary-400);
      bottom: -50px;
      left: -80px;
      animation: float 10s ease-in-out infinite reverse;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 1rem;
      background: rgba(255, 178, 0, 0.12);
      border: 1px solid rgba(255, 178, 0, 0.25);
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      color: var(--primary-300);
      margin-bottom: 1.5rem;
      animation: fadeIn 0.6s ease 0.2s both;
    }
    .hero-title {
      font-size: clamp(2.2rem, 5vw, 3.8rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      letter-spacing: -0.03em;
      animation: fadeIn 0.6s ease 0.3s both;
    }
    .hero-description {
      max-width: 600px;
      margin: 0 auto 2rem;
      font-size: 1.1rem;
      color: var(--text-secondary);
      line-height: 1.7;
      animation: fadeIn 0.6s ease 0.4s both;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 3rem;
      animation: fadeIn 0.6s ease 0.5s both;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 1.8rem;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
      color: #000000;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 1rem;
      transition: all var(--transition-fast);
      border: none;
      cursor: pointer;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-400), var(--primary-300));
      box-shadow: var(--shadow-glow);
      transform: translateY(-2px);
      color: #000000;
    }
    .btn-lg {
      padding: 1rem 2.2rem;
      font-size: 1.05rem;
    }
    .btn-arrow {
      transition: transform var(--transition-fast);
    }
    .btn-primary:hover .btn-arrow {
      transform: translateX(4px);
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      padding: 0.85rem 1.8rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-full);
      font-weight: 500;
      font-size: 1rem;
      transition: all var(--transition-fast);
    }
    .btn-ghost:hover {
      border-color: var(--primary-500);
      color: var(--primary-400);
      background: rgba(255, 178, 0, 0.06);
    }

    .hero-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      animation: fadeIn 0.6s ease 0.6s both;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--primary-400);
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: var(--border-default);
    }

    /* ── Features ── */
    .features {
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 2rem;
    }
    .section-title {
      text-align: center;
      font-size: clamp(1.5rem, 3vw, 2.2rem);
      font-weight: 700;
      margin-bottom: 2.5rem;
      letter-spacing: -0.02em;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      transition: all var(--transition-base);
    }
    .feature-card:hover {
      border-color: var(--primary-700);
      background: var(--bg-card-hover);
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    .feature-icon {
      color: var(--primary-500);
      margin-bottom: 0.75rem;
    }
    .feature-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .feature-card p {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    /* ── Tech ── */
    .tech-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem 4rem;
    }
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .tech-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .tech-item:hover {
      border-color: var(--primary-600);
      box-shadow: 0 0 12px rgba(255, 178, 0, 0.15);
    }
    .tech-name {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary);
    }
    .tech-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* ── CTA ── */
    .cta-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 2rem 4rem;
    }
    .cta-card {
      text-align: center;
      padding: 3rem 2rem;
      background: linear-gradient(135deg, var(--primary-900), var(--bg-card));
      border: 1px solid var(--primary-700);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-glow);
    }
    .cta-card h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .cta-card p {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid var(--border-subtle);
      padding: 1.5rem 2rem;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .footer-text {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-300), #ffffff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @media (max-width: 768px) {
      .hero { padding: 2rem 1rem; }
      .hero-stats { gap: 1rem; }
      .stat-divider { display: none; }
      .nav-link { display: none; }
      .footer-content { flex-direction: column; text-align: center; }
    }
  `]
})
export class LandingPage {}

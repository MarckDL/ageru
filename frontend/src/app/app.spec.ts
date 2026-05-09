import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { routes } from './app.routes';
import { UsuariosService } from './features/usuarios/services/usuarios.service';
import { of } from 'rxjs';

describe('App routing', () => {
  it('should navigate to /usuarios and load data', async () => {
    const mockService = {
      getUsuarios: () => of([])
    } as Partial<UsuariosService>;

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
      providers: [{ provide: UsuariosService, useValue: mockService }]
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/usuarios');

    expect(harness.routeNativeElement).toBeTruthy();
  });
});

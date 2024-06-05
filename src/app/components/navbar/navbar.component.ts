import { AuthService } from './../../services/firebase/auth.service';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

    user: any = null!;                  // Si existe el usuario, cambia el navbar
    toogled: boolean = false;   // Para cambiar el sentido de la flechita en el menú hambrguesa

    constructor(
        private firestoreService: FirestoreService,	// No se porque, pero no funciona si le quitan este servicio
        private authService: AuthService
    ) { }

    // Nos suscribimos, ya que el navbar siempre esta presente
    ngOnInit(): void {
        this.authService.getUsuarioConectado().subscribe((user: any) => {
            if (user) { this.user = user; }
            else { this.user = null!; }
        });
    }

    // Función para que se cierre el menú hamburguesa cuando esta chiquito
    toogle(button: any) {
        if (window.innerWidth < 992) { button.click(); }
    }

    // Cerrar sesión
    logout() {
        this.user = null!;
        this.authService.logout();
    }
}

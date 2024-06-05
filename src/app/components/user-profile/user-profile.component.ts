import { FirestoreService } from './../../services/firebase/firestore.service';
import { AuthService } from './../../services/firebase/auth.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

    loading: boolean = true;
    userFirebase: any;          // Este usuario contiene la informacion de firebase
    userFirestore: any;         // Este tiene la informacion de firestore (mas completo)
    calif: any;                 // Para hacer un ciclo en el HTML que ponga las estrellas
    calif_aux: any;             // Completar las estrellas huecas

    constructor(
        private router: Router,
        private authService: AuthService,
        private firestoreService: FirestoreService
    ) { }

    // Si no hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {
        this.authService.getUsuarioConectado().subscribe(async (user: any) => {
            // Ponemos en cargando la página
            this.loading = true;

            // Si no existe el usuario nos regresamos
            if (!user) { this.authService.navigate('home'); return; }

            // Si existe el usuario
            this.userFirebase = user;

            // Obtenemos la información del usuario
            await this.firestoreService.getUser(user.phoneNumber).then((res: any) => this.userFirestore = res.data());

            // Asignamos unos vectores para rellenar las calificaciones
            console.log('Calificacion', this.userFirestore);
            this.calif = Array(this.userFirestore.calificacion).fill(0).map((x, i) => i);
            this.calif_aux = Array(5 - this.userFirestore.calificacion).fill(0).map((x, i) => i);

            // Dejamos de cargar
            this.loading = false;
        });
    }

    navigate(link: string) { this.router.navigate([link]); }

}

import { FirestoreService } from './../../services/firebase/firestore.service';
import { AuthService } from './../../services/firebase/auth.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Servicio } from 'src/app/models/Servicio';

const cards = [
    {
        color: 'background-color: #918513',
        src: '../../../assets/img/ico_rayo.png',
        titulo: 'Electricista',
        contenido: 'This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.',
        link: 'omarrb76'
    },
    {
        color: 'background-color: #5F1134',
        src: '../../../assets/img/ico_paint.png',
        titulo: 'Pintor',
        contenido: 'This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.',
        link: 'omarrb76'
    },
    {
        color: 'background-color: #283866',
        src: '../../../assets/img/ico_plumb.png',
        titulo: 'Plomero',
        contenido: 'This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.',
        link: 'omarrb76'
    }
];

@Component({
    selector: 'app-loggedin',
    templateUrl: './loggedin.component.html',
    styleUrls: ['./loggedin.component.css']
})
export class LoggedinComponent implements OnInit {

    cards: any[] = cards;
    loading: boolean = true;
    user: any;
    servicios: Servicio[] = [];

    constructor(
        private router: Router,
        private authService: AuthService,
        private firestoreService: FirestoreService
    ) { }

    // Si no hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {
        this.authService.getUsuarioConectado().subscribe((user: any) => {
            this.loading = true;
            if (!user) { this.authService.navigate('home'); }
            this.user = user;
            console.log(this.user);
            this.loading = false;
        });

        this.firestoreService.getTodosServicios()
        .then(data => {
            data.forEach(doc => {
                this.servicios.push(doc.data())
            })
        })
        .finally(() => {
            console.log(this.servicios)
        })

    }

    navigate(link: string) { this.router.navigate([link]); }

    // Dependiendo de la hora nos devuelve un saludo diferente
    getSaludoHora() {
        let saludo: string = "";
        const hora = new Date().getHours();
        if (hora >= 0 && hora <12) saludo = 'Buenos días ';
        else if (hora < 19) saludo = 'Buenas tardes ';
        else saludo = 'Buenas noches '
        if (this.user != undefined) saludo += this.user.displayName;
        return saludo;
    }

}

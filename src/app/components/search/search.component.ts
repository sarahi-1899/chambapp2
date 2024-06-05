import { Servicio } from './../../models/Servicio';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { AuthService } from './../../services/firebase/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/User';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

    loading: boolean = true;
    busqueda: string = "";
    servicios: Servicio[] = [];
    usuarios:User[] = [];

    constructor(
        private router: Router,
        private authService: AuthService,
        private route: ActivatedRoute,
        private firestoreService: FirestoreService
    ) { }

    // Si no hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {
        this.route.params.subscribe(params=>{
            this.loading = true;
            this.busqueda = params.busqueda;
            this.loadServicios();
        })
        this.authService.getUsuarioConectado().subscribe((user: any) => {
            if (!user) { this.authService.navigate('home'); }
        });
    }

    loadServicios(){
        this.servicios = [];
        this.firestoreService.getTodosServicios()
        .then(data => {
            data.forEach(doc => {
                if(doc.data().nombre.toLowerCase().search(this.busqueda.toLowerCase()) != -1){
                    this.servicios.push(doc.data())
                }
            })
        })
        .finally(() => {
            console.log("Servicios",this.servicios)
            this.loadUserInfo();
        })
    }

    counter = 0;
    loadUserInfo(){
        this.usuarios = [];
        this.servicios.forEach(serv => {
            this.firestoreService.getUserPorUsername(serv.username)
            .then(res => {
                res.forEach((doc) => {
                    console.log("dato", doc.data())
                    this.usuarios.push(doc.data() as User);
                })
            })
        })
        this.loading = false;
    }

    navigate(link: string) { this.router.navigate([link]); }

    getNombre(i: number){
        return this.usuarios[i] ? this.usuarios[i].nombre +' '+this.usuarios[i].apellido: ''; 
    }

    getCalificacion(i: number){
        return this.usuarios[i] ? this.usuarios[i].calificacion: '';
    }

    getTelefono(i: number){
        return this.usuarios[i] ? this.usuarios[i].telefono: '';
    }

    getHorario(serv: Servicio){
        let dias:number[] = []
        let horario: string = "";
        if(serv.horario.length<7){
            serv.horario.forEach(h => {
                switch(h.dia){
                    case "Lunes": dias.push(1); break;
                    case "Martes": dias.push(2); break;
                    case "Miércoles": dias.push(3); break;
                    case "Jueves": dias.push(4); break;
                    case "Viernes": dias.push(5); break;
                    case "Sábado": dias.push(6); break;
                    case "Domingo": dias.push(7); break;
                }
            });
            dias.sort((a,b) => a-b);
            horario = `De ${this.getDia(dias[0])} a ${this.getDia(dias[dias.length-1])} de ${serv.horario[0].hora_inicio} a ${serv.horario[0].hora_termino} horas`
        } else {
            horario = `Todos los dias de ${serv.horario[0].hora_inicio} a ${serv.horario[0].hora_termino} horas`
        }

        return horario;
    }

    getDia(dia: number){
        switch(dia){
            case 1: return "Lunes"
            case 2: return "Martes"
            case 3: return "Miércoles"
            case 4: return "Jueves"
            case 5: return "Viernes"
            case 6: return "Sábado"
            case 7: return "Domingo"
            default: return "Error dia";
        }
    }

}

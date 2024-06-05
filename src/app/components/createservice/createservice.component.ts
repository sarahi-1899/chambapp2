import { StorageService } from './../../services/firebase/storage.service';
import { Archivo } from './../../models/Archivo';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from './../../services/firebase/auth.service';
import { WindowService } from './../../services/window.service';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Horario } from 'src/app/models/Horario';
import { Servicio } from 'src/app/models/Servicio';
import { tap, first } from 'rxjs/operators';

const tags = [
    "Aseo", "Fontanero", "Herrero", "Niñero", "Medicina",
    "Carpintero", "Albañil", "Trabajo pesado", "Abogado",
    "Cuidado del hogar", "Agua", "Jardinero", "Vigilante"
];
const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
    selector: 'app-createservice',
    templateUrl: './createservice.component.html',
    styleUrls: ['./createservice.component.css']
})
export class CreateserviceComponent implements OnInit {

    serviceForm: any = null!;           // Formulario de crear cuenta
    step: number = 0;                   // El paso en el que vamos [0 => Nombre del servicio, descripción del servicio, tags | 1 => horario | 2 => fotos ]
    tags = tags;                        // Elegir los tags, al menos 1 máximo 3
    dias = dias;                        // Para elegir el horario (ngFor)
    diaSelected: string = "Domingo";    // Para mostrar el horario de cada dia
    archivos: Archivo[] = [];           // Las fotos que subira el usuario, al menos 1 máximo 5
    loading: boolean = false;           // Mostrar la barra de cargando información a firebase
    user: any;                          // Para obtener el número de teléfono del usuario logeado
    ubicacion: string = "/";            // Ubicacion para el storage de firebase
    userFirestore: any;                 // Para guardar el username en la creación del servicio

    // Variables para poner errores en el formulario
    nombreEditado: boolean = false;
    descripcionEditado: boolean = false;

    constructor(
        private router: Router,
        private firestoreService: FirestoreService,	// No se porque, pero no funciona si le quitan este servicio
        private windowService: WindowService,
        private authService: AuthService,
        private storageService: StorageService
    ) {

        let horario: Horario[] = [];

        this.dias.forEach((x: string) => {
            horario.push({
                dia: x,
                hora_inicio: '10:00',
                hora_termino: '17:00',
                activado: true,
                error: false
            })
        });

        this.serviceForm = new FormGroup({
            nombre: new FormControl(null, [
                Validators.required,
                Validators.minLength(5),
                Validators.maxLength(30)
            ]),
            descripcion: new FormControl(null, [
                Validators.required,
                Validators.minLength(20),
                Validators.maxLength(255)
            ]),
            tags: new FormControl([], Validators.required),
            horario: new FormControl([...horario], Validators.required)
        });

    }

    // Si hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {

        this.storageService.getLoading$().subscribe((loading: boolean) => this.loading = loading);

        // Este si tiene que ser suscripcion, ya que un campo que se llena requiere especificamente del usuario logeado
        this.authService.getUsuarioConectado().subscribe(async (user: any) => {
            if (!user) { this.authService.navigate('home'); }
            this.user = user;
        });

    }

    // Navegamos al link indicado
    navigate(link: string) { this.router.navigate([link]); }

    /************************************************************************************************/
    /******************************* MÉTODOS PARA EL PASO DE TAGS ***********************************/
    /************************************************************************************************/

    // Ver si el tag esta seleccionado
    checkSelectedTag(tag: string) { return this.etiquetas.value.includes(tag); }

    // Ingresamos la etiqueta el arreglo de tags
    selectTag(tag: string) {

        // Si ya esta seleccionada, la quitamos del arreglo
        if (this.checkSelectedTag(tag)) {
            const index = this.etiquetas.value.indexOf(tag);
            this.etiquetas.value.splice(index, 1);
            return;
        }

        // El usuario solo puede elegir hasta 3 etiquetas y al menos 1
        if (this.etiquetas.value.length < 3) { this.etiquetas.value.push(tag); }

    }

    /************************************************************************************************/
    /******************************* MÉTODOS PARA EL PASO DEL HORARIO *******************************/
    /************************************************************************************************/

    // Para ponerlo en el horario
    primerLetra(palabra: string) { return palabra.charAt(0); }

    // Agregamos o removemos el dia al horario del ususario
    agregarRemoverDia(dia: string) {

        const checkbox = <HTMLInputElement>document.getElementById(dia);
        const index = this.days.value.findIndex((x: Horario) => x.dia == dia);

        let horarioNuevo = this.days.value[index];
        this.days.value.splice(index, 1);

        if (checkbox.checked) { horarioNuevo.activado = true; this.diaSelected = dia; }
        else {
            if (dia == this.diaSelected) {

                const nuevoDia = this.days.value.findIndex((x: Horario) => x.activado);
                if (nuevoDia != -1) { this.diaSelected = this.days.value[nuevoDia].dia; }
                else { this.diaSelected = "Ninguno"; }

            }
            horarioNuevo.activado = false;
        }

        this.days.value.push(horarioNuevo);

    }

    // Checa si la hora es correcta
    checarHora(tiempo1: any, tiempo2: any) {

        const hora_inicio = tiempo1.value.split(":");
        const hora_termino = tiempo2.value.split(":");

        // La hora de inicio es menor a la hora de termino
        if (parseInt(hora_inicio[0]) < parseInt(hora_termino[0])) { return true; }
        // La hora de inicio es igual a la hora de termino, pero los minutos son menores
        else if (parseInt(hora_inicio[0]) == parseInt(hora_termino[0]) && parseInt(hora_inicio[1]) < parseInt(hora_termino[1])) { return true; }
        // Esta mal la hora
        else { return false; }

    }

    // Se manda a llamar cada ve que cambiamos la hora
    cambioHora(tiempo1: any, tiempo2: any) {

        // Encontramos el dia en el arreglo
        const index = this.days.value.findIndex((x: Horario) => x.dia == this.diaSelected);
        let horarioNuevo = this.days.value[index];
        this.days.value.splice(index, 1);

        // Actualizamos información
        horarioNuevo.hora_inicio = tiempo1.value;
        horarioNuevo.hora_termino = tiempo2.value;
        horarioNuevo.activado = true;

        // Si las horas sin válidas, actualizamos el error
        if (this.checarHora(tiempo1, tiempo2)) { horarioNuevo.error = false; }
        else { horarioNuevo.error = true; }

        this.days.value.push(horarioNuevo);

    }

    // Función que se manda a llamar para encontrar un día (usado en los horarios)
    encontrarDia(dia: string) {
        const index = this.days.value.findIndex((x: Horario) => x.dia == dia);
        return this.days.value[index];
    }

    // Mostrar errores en la pantalla de horario
    mostrarErrores() {
        let respuesta = "";
        let primeraVez = true;
        this.days.value.forEach((x: Horario) => {
            if (x.error && x.activado) {
                if (primeraVez) {
                    primeraVez = false;
                    respuesta += "El horario de " + x.dia;
                } else {
                    respuesta += ", " + x.dia;
                }

            }
        });
        if (!primeraVez) { respuesta += " es erróneo" }
        return respuesta;
    }

    /************************************************************************************************/
    /******************************* MÉTODOS PARA EL PASO DE LAS FOTOS ******************************/
    /************************************************************************************************/

    //Evento que se gatilla cuando el input de tipo archivo cambia
    cambioArchivo(event: any) {

        // Si el usuario eligió archivos
        if (event.target.files.length > 0) {

            const archivo = event.target.files[0];

            if (this.archivos.length < 5) {
                this.archivos.push({                    // Metemos el nuevo archivo en el arreglo
                    archivo: archivo,
                    url: "",
                    porcentaje: 0
                });

                this.mostrarImagen(archivo);
                event.target.value = "";                // Por si el usuario borra la foto y vuelve a elegir la misma

            }

        }

    }

    // Obtiene el id de la imagen y cambia el src
    mostrarImagen(archivo: File) {

        setTimeout(() => {

            const imagenHTML = document.getElementById(archivo.name) as any;
            const reader = new FileReader();

            reader.readAsDataURL(archivo); // read file as data url

            reader.onload = (event) => { // called once readAsDataURL is completed
                imagenHTML.src = event.target?.result;
            };

        }, 0);

    }

    // Quita la imagen del arreglo de archivos
    borrarImagen(archivo: Archivo) {
        const index = this.archivos.indexOf(archivo);
        this.archivos.splice(index, 1);
    }

    /************************************************************************************************/
    /******************************* MÉTODOS DEL FORMULARIO *****************************************/
    /************************************************************************************************/

    // GETS
    get nombre() { return this.serviceForm.get('nombre'); }
    get descripcion() { return this.serviceForm.get('descripcion'); }
    get days() { return this.serviceForm.get('horario'); }
    get etiquetas() { return this.serviceForm.get('tags'); }

    // Función que se manda a llamar para ver si un campo fue editado
    keyUp(campo: string) {
        switch (campo) {
            case 'nombre': this.nombreEditado = true; break;
            case 'descripcion': this.descripcionEditado = true; break;
        }
    }

    // Mostramos diferentes campos del formulario con cada paso
    cambiarPaso(adelante: boolean) {

        adelante ? this.step++ : this.step--;

        // Si estamos en las fotos y el usuario ya habia elegido unas, las pintamos
        if (this.step == 2) {
            this.archivos.forEach((x: Archivo) => { this.mostrarImagen(x.archivo); })
        } else if (this.step == 3) { this.submitServiceForm() }

    }

    // Get que nos permite desactivar los botones si los campos no son válidos
    get serviceFormDisabled() {
        switch (this.step) {
            case 0:
                return this.nombre.valid && this.descripcion.valid && this.etiquetas.value.length > 0 && this.etiquetas.value.length < 4;
            case 1:
                // Checa si existe algun error en los horarios
                let result = true;
                this.days.value.forEach((x: Horario) => {
                    if (x.error && x.activado) { result = false; return; } // Si el dia esta activado y tiene error
                });
                const index = this.days.value.findIndex((x: Horario) => x.activado); // Al menos debe de tener un dia activado
                if (index != -1) { return result; }
                return false;
            case 2: return this.archivos.length > 0 ? true : false;
            default: return false;
        }
    }

    // Procesamos el formulario de servicio
    async submitServiceForm() {

        // En este punto ya tenemos todos los campos validados, mandemoslos a firebase

        // Le decimos al subject que esta cargando la página
        this.storageService.setLoading$(true);

        // Obtenemos la información del usuario
        await this.firestoreService.getUser(this.user.phoneNumber).then((res: any) => this.userFirestore = res.data());

        // Cuando termine de cargar los archivos ejecutamos lo que hay en el then (subimos la informacion a firebase)
        await this.storageService.getLoading$().pipe(tap(), first())
            .toPromise().then((res: boolean) => {

                // Links de las fotos que estaran en firebase
                let archivosLinks: any[] = [];
                this.archivos.forEach((x: Archivo) => {
                    archivosLinks.push(x.url);
                });

                // Objeto servicio que agregaremos a firebase
                const servicio: Servicio = {
                    nombre: this.nombre.value,
                    descripcion: this.descripcion.value,
                    tags: this.etiquetas.value,
                    horario: this.days.value,
                    fotos: archivosLinks,
                    username: this.userFirestore.username
                }

                // Lo ponemos en loading otra vez (solo se ve en conexiones super lentas)
                this.storageService.setLoading$(true);
                this.firestoreService.putServicio(servicio, this.user.phoneNumber).then(() => {
                    this.storageService.setLoading$(false);
                    this.navigate('home');
                });
            });

    }

}

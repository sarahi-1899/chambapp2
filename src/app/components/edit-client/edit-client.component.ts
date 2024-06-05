import { StorageService } from './../../services/firebase/storage.service';
import { Archivo } from './../../models/Archivo';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { AuthService } from './../../services/firebase/auth.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { tap, first } from 'rxjs/operators';

const estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Coahuila', 'Colima', 'Ciudad de México / Distrito Federal', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
    'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
    'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

@Component({
    selector: 'app-edit-client',
    templateUrl: './edit-client.component.html',
    styleUrls: ['./edit-client.component.css']
})
export class EditClientComponent implements OnInit {

    loading: boolean = true;
    loadingFiles: boolean = false;
    ubicacion: string = "/";    // Ubicacion para el storage de firebase
    estados = estados;          // Los estados de México
    userFirebase: any;          // Información de firebase
    userFirestore: any;         // Información de firestore
    editForm: any = null!;      // Formulario de crear cuenta
    imagen = '';                // En caso de que haya decidido subir una nueva imagen
    archivos: Archivo[] = [];   // Las fotos que subira el usuario, al menos 1 máximo 5

    // Variables para poner errores en el formulario
    nombreEditado: boolean = false;
    apellidoEditado: boolean = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private firestoreService: FirestoreService,
        private storageService: StorageService
    ) {
        this.editForm = new FormGroup({
            nombre: new FormControl(null, [
                Validators.required,
                Validators.pattern('[a-zA-Z .]+'),
                Validators.minLength(2),
                Validators.maxLength(25)
            ]),
            apellido: new FormControl(null, [
                Validators.required,
                Validators.pattern('[a-zA-Z .]+'),
                Validators.minLength(2),
                Validators.maxLength(25)
            ]),
            estado: new FormControl(null, Validators.required),
            fecha: new FormControl(null, Validators.required),
            genero: new FormControl(null, Validators.required)
        });
    }

    // Si no hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {

        this.storageService.getLoading$().subscribe((loading: boolean) => this.loadingFiles = loading);

        this.authService.getUsuarioConectado().subscribe(async (user: any) => {
            // Ponemos en cargando la página
            this.loading = true;

            // Si no existe el usuario nos regresamos
            if (!user) { this.authService.navigate('home'); return; }

            // Si existe el usuario
            this.userFirebase = user;

            // Obtenemos la información del usuario
            await this.firestoreService.getUser(user.phoneNumber).then((res: any) => this.userFirestore = res.data());

            // Ponemos los valores que ya traemos de la BD
            this.nombre.value = this.userFirestore.nombre;
            this.apellido.value = this.userFirestore.apellido;
            this.estado.value = this.userFirestore.estado;
            this.fecha.value = this.userFirestore.fecha;
            this.genero.value = this.userFirestore.genero;
            this.imagen = this.userFirebase.photoURL;

            // Dejamos de cargar
            this.loading = false;
        });
    }

    navigate(link: string) { this.router.navigate([link]); }

    // Mandar la información de editar perfil
    async submitEditForm() {

        this.loading = true;

        // Si cambiamos la imagen vamos a cargarla en el storage
        if (this.imagen != this.userFirebase.photoURL) {

            // Le decimos al subject que esta cargando la página
            this.storageService.setLoading$(true);

            // Cuando termine de cargar los archivos ejecutamos lo que hay en el then (subimos la informacion a firebase)
            await this.storageService.getLoading$().pipe(tap(), first()).toPromise().then((res: boolean) => {
                // Le guardamos el link
                this.imagen = this.archivos[0].url;
            });
        }

        // Si cambio el nombre o la imagen, entonces actualizamos el perfil
        if (this.nombre.value != this.userFirebase.displayName || this.imagen != this.userFirebase.photoUR) {
            const nuevo = {
                displayName: this.nombre.value,
                photoURL: this.imagen
            };
            await this.authService.updateProfile(nuevo);
            await this.firestoreService.updateUser({ photoURL: this.imagen }, this.userFirebase.phoneNumber).then();
        }

        // Si cambio cualquiera de estas cosas, las tenemos que actualizar
        if (this.nombre.value != this.userFirestore.nombre ||
            this.apellido.value != this.userFirestore.apellido ||
            this.estado.value != this.userFirestore.estado ||
            this.fecha.value != this.userFirestore.fecha ||
            this.genero.value != this.userFirestore.genero) {
            const nuevo = {
                nombre: this.nombre.value,
                apellido: this.apellido.value,
                estado: this.estado.value,
                fecha: this.fecha.value,
                genero: this.genero.value
            }
            await this.firestoreService.updateUser(nuevo, this.userFirebase.phoneNumber).then();
        }

        this.loading = false;
    }

    // Get que nos permite desactivar el botón de guardar si los campos son incorrectos
    get editFormDisabled() {
        // Si es válido el form y modifico aunque sea uno de estos campos
        if (this.editForm.valid && (
            this.nombre.value != this.userFirestore.nombre ||
            this.apellido.value != this.userFirestore.apellido ||
            this.estado.value != this.userFirestore.estado ||
            this.fecha.value != this.userFirestore.fecha ||
            this.genero.value != this.userFirestore.genero ||
            this.imagen != this.userFirebase.photoURL
        )) {
            return false;
        } else {
            return true;
        }
    }

    // GETS
    get nombre() { return this.editForm.get('nombre'); }
    get apellido() { return this.editForm.get('apellido'); }
    get estado() { return this.editForm.get('estado'); }
    get fecha() { return this.editForm.get('fecha'); }
    get genero() { return this.editForm.get('genero'); }

    // Función que se manda a llamar para ver si un campo fue editado
    keyUp(campo: string) {
        switch (campo) {
            case 'nombre': this.nombreEditado = true; break;
            case 'apellido': this.apellidoEditado = true; break;
        }
    }

    // Nos devuelve si el estado es el seleccionado
    getSelectedState(state: string) {
        return state == this.estado.value ? true : false;
    }

    // Nos devuelve el genero seleccionado para los radio botones
    getCheckedGenre(genre: string) {
        return genre == this.genero.value ? true : false;
    }

    /************************************************************************************************/
    /******************************* MÉTODOS PARA EL PASO DE LAS FOTOS ******************************/
    /************************************************************************************************/

    //Evento que se gatilla cuando el input de tipo archivo cambia
    cambioArchivo(event: any) {

        // Si el usuario eligió archivos
        if (event.target.files.length > 0) {

            // Conseguimos el primer archivo
            const archivo = event.target.files[0];

            // Vaciamos el arreglo (es un vetor porque mi funcion trabaja con un arreglo y no con archivos por separado)
            this.archivos = [];

            // Metemos el nuevo archivo
            this.archivos.push({
                archivo: archivo,
                url: "",
                porcentaje: 0
            });

            // Mostramos la imagen
            this.mostrarImagen(archivo);

            // Cambiamos el nombre de la imagen para saber que fue editada
            this.imagen = archivo.name;

            // Por si el usuario borra la foto y vuelve a elegir la misma
            event.target.value = "";
        }
    }

    // Obtiene el id de la imagen y cambia el src
    mostrarImagen(archivo: File) {

        setTimeout(() => {

            const imagenHTML = document.getElementById('profile-image') as any;
            const reader = new FileReader();

            reader.readAsDataURL(archivo); // read file as data url

            reader.onload = (event) => { // called once readAsDataURL is completed
                imagenHTML.src = event.target?.result;
            };

        }, 0);

    }
}

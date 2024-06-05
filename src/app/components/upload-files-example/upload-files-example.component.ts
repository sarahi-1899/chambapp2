/* Componente de ejemplo para demostrar como subir archivos a firebase storage */

import { Archivo } from './../../models/Archivo';
import { StorageService } from './../../services/firebase/storage.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-upload-files-example',
    templateUrl: './upload-files-example.component.html',
    styleUrls: ['./upload-files-example.component.css']
})
export class UploadFilesExampleComponent implements OnInit {

    ubicacion: string = "/";    // Ubicacion para el storage de firebase

    // Formulario con el que manejamos la subida de archivos
    public archivoForm = new FormGroup({
        archivo: new FormControl(null, Validators.required),
    });

    // Variables para el control de la vista con el formulario
    mensajeArchivo = 'No hay un archivo seleccionado';
    loading: boolean = false;
    error: boolean = false;

    // Múltiples archivos, en estos arreglos estarán los archivos y las referencias (links) a ellos
    archivos: Archivo[] = [];

    // Usamos el servicio de storage
    constructor(private storageService: StorageService) { }

    // Nos suscribimos al loading del servicio para saber si ha existido algun cambio
    // es decir, saber si ya se cargaron los archivos
    ngOnInit(): void {
        this.storageService.getLoading$().subscribe((loading: boolean) => this.loading = loading);
    }

    //Evento que se gatilla cuando el input de tipo archivo cambia
    cambioArchivo(event: any) {

        // Si el usuario eligió archivos
        if (event.target.files.length > 5) {                          // Si el usuario seleccionó más de 5 archivos

            this.mensajeArchivo = 'Máximo selecciona 5 archivos';
            this.error = true;

        } else if (event.target.files.length > 0) {

            this.archivos = [];                                         // Vaciamos los archivos (por si ya hubiera unos cargados)
            this.error = false;                                         // Ponemos el error en falso para que no se marque de rojo
            this.mensajeArchivo = 'Archivo(s) preparado(s):';           // Ponemos un mensaje
            for (let i = 0; i < event.target.files.length; i++) {       // Recorremos cada uno de los archivos y lo agregamos a nuetsro arreglo
                this.mensajeArchivo += ' ' + event.target.files[i].name;
                this.archivos.push({                                      // Metemos el nuevo archivo en el arreglo
                    archivo: event.target.files[i],
                    url: "",
                    porcentaje: 0
                });
            }

        } else {

            this.mensajeArchivo = 'No hay un archivo seleccionado';

        }

    }

    //Sube el archivo a Cloud Storage, tiene async a lo wey. Pero funciona
    subirArchivo() {

        // Le decimos al subject que esta cargando la página
        this.storageService.setLoading$(true);

        // Se termino de cargar reseteamos el formulario
        this.archivoForm.reset();
        this.mensajeArchivo = 'No hay un archivo seleccionado';
        this.error = false;

    }

    // Devuelve si el boton de subir archivo debe de estar acticado o no
    getDisabled(): boolean {
        return !this.archivoForm.valid || this.error;
    }

}

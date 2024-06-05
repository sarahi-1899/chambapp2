/* Este componente se encarga de mostrar la barra de cargando
y del avance que lleva con cada uno de los archivos que recibió. Esto para
que el cliente obtenga un feedback de que es lo que esta pasando.
Se piensa reusar en varias secciones del proyecto */

import { StorageService } from './../../services/firebase/storage.service';
import { Archivo } from './../../models/Archivo';
import { Component, Input, OnInit } from '@angular/core';
import { NgxImageCompressService } from 'ngx-image-compress';
import { tap, first } from 'rxjs/operators';

@Component({
    selector: 'app-loading-files',
    templateUrl: './loading-files.component.html',
    styleUrls: ['./loading-files.component.css']
})
export class LoadingFilesComponent implements OnInit {

    // Los archivos nos los van a mandar desde un componente padre
    @Input() files: Archivo[] = [];
    @Input() username: string = "";
    @Input() ubicacion: string = "";

    log: string = "";

    constructor(
        private storageService: StorageService,
        private imageCompress: NgxImageCompressService
    ) { }

    ngOnInit(): void {
        this.storageService.getLog$().subscribe(log => this.log = log);
        this.subirArchivos();
    }

    // Método para la barrita de carga de la GUI
    getPorcentaje(archivo: Archivo) {
        return `width: ${archivo.porcentaje}%;`;
    }

    // Método para subir los archivos a firebase
    async subirArchivos() {

        // Vamos a esperar a que todo este código termine para continuar con lo demás
        await Promise.all(this.files.map(async (file) => {

            // El archivo con el nuevo tamaño (de ser necesario)
            const resized = await this.compressFile(file.archivo).then();

            // Comprobamos si la foto es de perfil o de servicio
            let filename = this.username + this.ubicacion;
            if (this.ubicacion == '/') filename += 'profile';
            else filename += file.archivo.name;

            // Empezamos los trabajos de obtener referencia (link al archivo) y de subir el archivo
            let referencia = this.storageService.URLCloudStorage(filename);
            let tarea = this.storageService.uploadCloudStorage(filename, resized);

            // Nos suscribimos a cambios en el porcentaje
            tarea.percentageChanges().subscribe((porcentaje) => file.porcentaje = porcentaje!);

            // Cuando se acabe la tarea, vamos a obtener la URL
            await tarea.then(async () => {
                this.storageService.setLog$('Obteniendo URL de ' + file.archivo.name);
                await referencia.getDownloadURL().pipe(tap(), first())
                    .toPromise().then((URL) => file.url = URL);
            });

        }));

        // Termino de cargar
        this.storageService.setLoading$(false);
    }

    // Comprimimos el archivo
    async compressFile(file: File): Promise<File> {

        // Informamos que estamos haciendo
        this.storageService.setLog$('Comprimiendo imagen: ' + file.name);

        // Referencia a la imagen
        let image: any = "";

        // Leemos la imagen como URL
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        // Promesa, para primero comprimir la imagen y después convertirla en File
        const promise = new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
                image = event.target?.result!;
                while ((this.imageCompress.byteCount(image) / 1000) > 500) {
                    const orientation = await this.imageCompress.getOrientation(image).then();
                    await this.imageCompress.compressFile(image, orientation, 50, 50).then(result => image = result);
                }
                resolve(); // Se completo la promesa
            }
        })

        // Esperamos a la promesa y convertimos la imagen en un File
        await promise.then();

        // Informamos en el log
        this.storageService.setLog$('Creando archivo de ' + file.name);

        const blob = this.dataURItoBlob(image);
        return new File([blob], file.name, { type: file.type });

    }

    // No tengo idea de como funciona este código, pero obtiene un archivo
    // Blob desde la URI que le mandamos
    dataURItoBlob(dataURI: string) {

        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });

    }

}

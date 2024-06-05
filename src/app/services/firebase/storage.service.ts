import { OnDestroy } from '@angular/core';
/* Servicio para acceder al storage de firebase */

import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StorageService implements OnDestroy {

    // Observable de que el sitio esta cargando, nos sirve porque vamos a estar 
    // subiendo archivos en varias partes del proyecto, entonces mejor reusamos código
    private loading$ = new Subject<boolean>();

    // Otro observable, para indicarle al usuario lo que estamos haciendo
    private log$ = new Subject<string>();

    constructor(private storage: AngularFireStorage) { }

    // Cuando ya no se use este servicio se ccompletan los observables para liberar recursos
    ngOnDestroy(): void {
        this.loading$.complete();
        this.log$.complete();
    }

    // Conseguimos el observable para aquel componente que lo vaya a consumir
    getLoading$(): Observable<boolean> {
        return this.loading$.asObservable();
    }

    // Seteamos el nuevo valor para el sujeto
    setLoading$(nuevo: boolean) {
        this.loading$.next(nuevo);
    }

    // Conseguimos el mensaje
    getLog$(): Observable<string> {
        return this.log$.asObservable();
    }

    // Seteamos el mensaje
    setLog$(message: string) {
        this.log$.next(message);
    }

    // Tarea para subir foto
    uploadCloudStorage(nombreArchivo: string, datos: any) {
        return this.storage.upload(nombreArchivo, datos);
    }

    // Referencia del archivo
    URLCloudStorage(nombreArchivo: string) {
        return this.storage.ref(nombreArchivo);
    }

}

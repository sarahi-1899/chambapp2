/* Servicio para comunicarnos con firebase */

import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Servicio } from 'src/app/models/Servicio';
import { User } from 'src/app/models/User';
import { tap, first } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FirestoreService {

    constructor(private db: AngularFirestore) { }

    /***** OPERACIONES DE USUARIO *****/

    // Crear el perfil del nuevo usuario
    putUser(user: User) {
        return this.db.collection('users').doc(user.telefono).set(user);
    }

    // Obtenemos la información del usuario
    getUser(phoneNumber: string) {
        return this.db.collection('users').doc(phoneNumber).get().pipe(tap(), first()).toPromise();
    }

    // Obtenemos la información de un usuario dado el username
    getUserPorUsername(username: string) {
        return this.db.collection('users', res => res.where('username', '==', username)).get().pipe(tap(), first()).toPromise();
    }

    updateUser(user: any, id: string) {
        return this.db.collection('users').doc(id).update(user);
    }

    /***** OPERACIONES PARA SERVICIO *****/

    // Crear el nuevo servicio
    putServicio(servicio: Servicio, id: string) {
        return this.db.collection('servicios').doc(id).set(servicio);
    }

    // Actualizar el servicio
    updateServicio(servicio: Servicio, id: string) {
        return this.db.collection('servicios').doc(id).update(servicio);
    }

    // Obtiene un servicio en específico
    getServicio(id: string) {
        return this.db.collection('servicios').doc(id).get().pipe(tap(), first()).toPromise();
    }

    // Obtiene los servicios que coincidan con el dueño
    getServicios(id: string) {
        return this.db.collection('servicios', res => res.where('username', '==', id)).get().pipe(tap(), first()).toPromise();
    }

    // Obtiene los servicios que coincidan completamente con el nombre dado
    getServiciosPorNombre(nombre: string): Servicio[]{
        let servicios: Servicio[] = [];
        this.db.collection<Servicio>('servicios').get().toPromise()
        .then(data => {
            data.forEach(doc => {
                if(doc.data().nombre.toLowerCase().search(nombre.toLowerCase()) != -1){
                    servicios.push(doc.data());
                }
            })
        })
        .finally(() => {
            console.log(servicios);
        })
        return servicios;
    }

    // Obtiene todos los servicios sin distincion
    getTodosServicios(){
        return this.db.collection<Servicio>('servicios').get().toPromise();
    }

    /***** VALIDACIONES *****/

    // Revisa si existe el numero en la BD
    async getNumeroExists(numero: string) {
        let respuesta = false;
        await this.db.collection('users').doc(numero).get().pipe(tap(), first()).toPromise().then((x: any) => respuesta = x.exists);
        return respuesta;
    }

    // Revisa si ya existe el nombre de usuario
    async getUsernameExists(username: string) {
        let respuesta = false;
        await this.db.collection('users', res => res.where('username', '==', username)).get().pipe(tap(), first()).toPromise().then((x: any) => respuesta = !x.empty);
        return respuesta;
    }

    /********************* METODOS DE EJEMPLO (YA LOS BORRAREMOS) ************************/

    // Conseguimos las tareas
    getTareas() {
        return this.db.collection('tareas', res => res.orderBy('fecha', 'asc')).get();
    }

    // Creamos una tarea nueva
    putTarea(tarea: any) {
        return this.db.collection('tareas').add(tarea);
    }

    // Actualizamos una tarea
    updateTarea(tarea: any) {
        return this.db.collection('tareas').doc(tarea.id).update({ tarea: tarea.tarea, fecha: Date.now() });
    }

    // Borramos una tarea
    deleteTarea(id: any) {
        return this.db.collection('tareas').doc(id).delete();
    }
}

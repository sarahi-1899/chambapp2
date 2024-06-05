/* Código de un CRUD simple para subir información a firestore */

import { Component, OnInit } from '@angular/core';
import { FirestoreService } from './../../services/firebase/firestore.service';

@Component({
    selector: 'app-firestore-example',
    templateUrl: './firestore-example.component.html',
    styleUrls: ['./firestore-example.component.css']
})
export class FirestoreExampleComponent implements OnInit {

    // Variables para las tareas
    tarea: any = "";
    tareas: any[] = [];
    error: string = "";
    loading: boolean = false;
    modoEdicion: boolean = false;
    id: string = ""; // Guardamos el id de la tarea que quiera editar o borrar

    constructor(private firestore: FirestoreService) { }

    ngOnInit(): void {
        // Conseguimos las tareas
        this.firestore.getTareas().subscribe(res => {
            res.docs.forEach((doc: any) => this.tareas.push({ id: doc.id, ...doc.data() }));
        });
    }

    async submitTarea() {

        // Si no escribió nada lo regresamos
        if (!this.tarea.trim()) {
            this.error = 'Escriba algo por favor';
            return;
        }

        // Esta cargando
        this.loading = true;

        // Obtenemos la fecha, ya que en el if lo usamos
        const fecha = Date.now();

        if (this.modoEdicion) {

            // Editamos la tarea y también el vector de tareas
            await this.firestore.updateTarea({ id: this.id, tarea: this.tarea, fecha: fecha });
            this.tareas = this.tareas.map(item => (
                item.id == this.id ? { id: item.id, tarea: this.tarea, fecha: fecha } : item
            ));

        } else {

            // Creamos una nueva tarea y la agregamos al vector
            const nueva = await this.firestore.putTarea({ tarea: this.tarea, fecha: fecha }).then((res: any) =>
                ({ id: res.id, tarea: this.tarea, fecha: fecha })
            );
            this.tareas = [...this.tareas, nueva];

        }

        // Termino de subirse la nueva tarea, agregamos el nuevo archivo y permitimos que los
        // botones funcionen de nuevo
        this.loading = false;
        this.tarea = "";
        this.error = "";
        this.modoEdicion = false;
        this.id = "";
    }

    // Conseguimos información acerca de la tarea que queremos editar
    editarTarea(tarea: any) {
        this.modoEdicion = true;
        this.tarea = tarea.tarea;
        this.id = tarea.id;
    }

    // Conseguimos la tarea que queremos eliminar
    async eliminarTarea(id: string) {

        this.loading = true;
        await this.firestore.deleteTarea(id);
        this.tareas = this.tareas.filter(item => item.id != id);
        this.loading = false;

    }

}

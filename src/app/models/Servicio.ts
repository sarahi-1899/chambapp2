import { Horario } from "./Horario";

export interface Servicio {
    nombre: string,
    descripcion: string,
    tags: string[],
    horario: Horario[],
    fotos: any,
    username: string
}
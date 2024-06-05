// Esta interface es para tener un mejor control de los
// archivos que los usuarios van a subir en el sistema
export interface Archivo {
    archivo: File,           // El archivo en si
    url: string,            // La url donde se guardo el archivo
    porcentaje: number      // Este sirve para mostrar cuanto porcentaje lleva de upload el archivo
}
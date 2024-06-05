/* Servicio que nos devuelve la referencia de la ventana (para el ReCaptcha) */

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WindowService {

    public getWindowRef() {
        return window;
    }

}

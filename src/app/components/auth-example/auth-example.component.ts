/* Ejemplo para iniciar sesión con número de teléfono */

import { AuthService } from './../../services/firebase/auth.service';
import { WindowService } from './../../services/window.service';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-auth-example',
    templateUrl: './auth-example.component.html',
    styleUrls: ['./auth-example.component.css']
})
export class AuthExampleComponent implements OnInit {

    windowRef: any;                   // Referencia de la ventana (necesaria para que funcione el reCapctha)
    verificationCode: string = "";    // Código de verificación
    user: any;                        // El usuario que inicio sesión
    phoneNumber: FormGroup = null!;   // Formulario de número de teléfono
    error: string = "";               // Mostrar mensaje de error

    constructor(
        private firestoreService: FirestoreService,     // No se porque, pero no funciona si le quitan este servicio
        private windowService: WindowService,
        private authService: AuthService
    ) {
        this.phoneNumber = new FormGroup({
            number: new FormControl(null, [Validators.required, Validators.pattern('[0-9]{10}')]),
        });
    }

    ngOnInit() {
        // Obtenemos la referencia de la ventana y dibujamos el reCaptcha
        this.windowRef = this.windowService.getWindowRef();
        this.windowRef.recaptchaVerifier = this.authService.recaptchaVerifier();
        this.windowRef.recaptchaVerifier.render();
    }

    sendLoginCode() {

        const appVerifier = this.windowRef.recaptchaVerifier;
        const num = '+52' + this.phoneNumber.value.number;

        this.authService.signInWithPhoneNumber(num, appVerifier)
            .then(result => {
                this.windowRef.confirmationResult = result;
            })
            .catch(error => console.log(error));

    }

    verifyLoginCode() {
        this.windowRef.confirmationResult
            .confirm(this.verificationCode)
            .then((result: any) => {
                this.user = result.user;
            })
            .catch((error: any) => console.log(error, 'Incorrect code entered'));
    }

    keyUp() {
        if (this.phoneNumber.valid) {
            this.error = "";
        } else {
            this.error = "Ingresa un número de teléfono válido";
        }
    }

}

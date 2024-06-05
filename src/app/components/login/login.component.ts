import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from './../../services/firebase/auth.service';
import { WindowService } from './../../services/window.service';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap, first } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

    windowRef: any;             // Referencia de la ventana (necesaria para que funcione el reCapctha)
    loginForm: any = null!;     // Formulario de iniciar sesión
    codeForm: any = null!;      // Formulario para colocar SMS del teléfono
    step: number = 0;           // El paso en el que vamos [0 => telefono | 1 => confirmar telefono ]
    errorTEL: string = "";      // Mostramos error porque el numero no esta registrado
    errorSMS: string = "";      // Mostramos un mensaje de error si se equivoco en el código de SMS

    // Variables para poner errores en el formulario
    telefonoEditado: boolean = false;
    codeEditado: boolean = false;

    constructor(
        private router: Router,
        private firestoreService: FirestoreService,	// No se porque, pero no funciona si le quitan este servicio
        private windowService: WindowService,
        private authService: AuthService
    ) {

        this.loginForm = new FormGroup({
            telefono: new FormControl(null, [Validators.required, Validators.pattern('[0-9]{10}')])
        });

        this.codeForm = new FormGroup({
            code: new FormControl(null, [Validators.required, Validators.pattern('[0-9]{6}')])
        });

    }

    // Si hay un usuario activo, no deberia de estar en esta página
    ngOnInit() {

        this.authService.getUsuarioConectado().pipe(tap(), first()).toPromise().then((user: any) => {
            if (user) { this.authService.navigate('home'); }
        });

        setTimeout(() => {
            // Obtenemos la referencia de la ventana y dibujamos el reCaptcha
            this.windowRef = this.windowService.getWindowRef();
            this.windowRef.recaptchaVerifier = this.authService.recaptchaVerifier();
            this.windowRef.recaptchaVerifier.render();
        }, 0);

    }

    // GETS
    get telefono() { return this.loginForm.get('telefono'); }
    get code() { return this.codeForm.get('code'); }

    // Navegamos al link indicado
    navigate(link: string) {
        this.router.navigate([link]);
    }

    // Función que se manda a llamar para ver si un campo fue editado
    keyUp(campo: string) {
        switch (campo) {
            case 'telefono': this.telefonoEditado = true; break;
            case 'code': this.codeEditado = true; break;
        }
    }

    // Get que nos permite desactivar los botones si los campos no son válidos
    get signUpFormDisabled() {
        switch (this.step) {
            case 0: return false;
            case 1: return this.code.valid;
            default: return false;
        }
    }

    // Mostramos diferentes campos del formulario con cada paso
    cambiarPaso(adelante: boolean) {

        // Sumamos o restamos el paso
        adelante ? this.step++ : this.step--;

        // Esta en el paso de llenar el número de teléfono
        if (this.step == 0) {
            setTimeout(() => {
                // Obtenemos la referencia de la ventana y dibujamos el reCaptcha
                this.windowRef = this.windowService.getWindowRef();
                this.windowRef.recaptchaVerifier = this.authService.recaptchaVerifier();
                this.windowRef.recaptchaVerifier.render();
            }, 0);
        }

    }

    // Es llamado cuando se envía el formulario completo
    async submitLoginForm() {

        // Lo único que no puedo verificar antes de envíar el formulario es el teléfono, pero eso se arregla con el if de abajo
        if (this.loginForm.valid) {

            const appVerifier = this.windowRef.recaptchaVerifier;
            const num = '+52' + this.telefono.value;

            // Verificamos si ya existe un usuario con este número, no queremos borrarle la información
            const exists = await this.firestoreService.getNumeroExists(num);
            if (!exists) {
                this.errorTEL = "Este número no se encuentra registrado, para registrarse haga clic ";
                return;
            }

            // Si no existe quitamos el error (en caso de que haya tenido uno)
            this.errorTEL = "";

            this.authService.signInWithPhoneNumber(num, appVerifier)
                .then(result => {
                    this.windowRef.confirmationResult = result;
                    this.step++;
                })
                .catch(error => console.log(error));

        } else { this.telefonoEditado = true; }

    }

    // Es llamado para enviar el código de SMS
    submitCodeForm() {

        if (this.codeForm.valid) {
            this.windowRef.confirmationResult
                .confirm(this.code.value)
                .then((result: any) => {
                    this.navigate('home');
                    console.log('Inicio sesion correctamente');
                })
                .catch((error: any) => {
                    if (error.code == 'auth/invalid-verification-code') {
                        this.errorSMS = "El código ingresado es incorrecto.";
                    }
                    console.log(error, 'Incorrect code entered')
                });
        }

    }

}

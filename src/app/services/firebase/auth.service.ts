/* Servicio para la autenticacion de firebase */

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(
        private auth: AngularFireAuth,
        private router: Router
    ) {

        this.auth.useDeviceLanguage(); // Ajusta el lenguaje para que cada persona lo vea segun su idioma

    }

    // GETS Y SETS
    getUsuarioConectado() { return this.auth.user; }

    // Navegamos al link
    navigate(link: string) { this.router.navigate([link]); }

    // Crea el recaptcha en pantalla con el div (id) epecificado
    public recaptchaVerifier() {
        const boton = <HTMLInputElement>document.getElementById("submit-button");
        return new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal', // normal
            'callback': (response: any) => {
                boton.disabled = false;
            },
            'expired-callback': () => {
                boton.disabled = true;
            }
        });
    }

    // Crear cuenta con numero de telefono
    signInWithPhoneNumber(num: string, appVerifier: any) {
        return this.auth.signInWithPhoneNumber(num, appVerifier);
    }

    // Actualizar el perfil de usuario
    updateProfile(profile: any) {
        return firebase.auth().currentUser?.updateProfile(profile);
    }

    // Cerramos sesion
    logout() {
        this.auth.signOut();
    }
}

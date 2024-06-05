import { AuthService } from './../../services/firebase/auth.service';
import { WindowService } from './../../services/window.service';
import { FirestoreService } from './../../services/firebase/firestore.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from 'src/app/models/User';
import { tap, first } from 'rxjs/operators';

const estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
    'Coahuila', 'Colima', 'Ciudad de México / Distrito Federal', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
    'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
    'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

    windowRef: any;             // Referencia de la ventana (necesaria para que funcione el reCapctha)
    signUpForm: any = null!;    // Formulario de crear cuenta
    codeForm: any = null!;      // Formulario para colocar SMS del teléfono
    estados = estados;          // Los estados de México
    step: number = 0;           // El paso en el que vamos [0 => nombre, apellido, estado | 1 => fecha de nacimiento, genero, nombre de usuario, tipo de usuario | 2 => telefono | 3 => confirmar telefono ]
    errorUsername: string = ""; // Mostramos error de que ya existe ese username
    errorTelefono: string = ""; // Mostramos error de que ya existe ese número de teléfono
    errorSMS: string = "";      // Mostramos un mensaje de error si se equivoco en el código de SMS
    loading: boolean = false;   // Para mostrar un spinner cuando este cargando la pagina

    // Variables para poner errores en el formulario
    nombreEditado: boolean = false;
    apellidoEditado: boolean = false;
    usernameEditado: boolean = false;
    telefonoEditado: boolean = false;
    codeEditado: boolean = false;

    constructor(
        private router: Router,
        private firestoreService: FirestoreService,	// No se porque, pero no funciona si le quitan este servicio
        private windowService: WindowService,
        private authService: AuthService
    ) {

        this.signUpForm = new FormGroup({
            nombre: new FormControl(null, [
                Validators.required,
                Validators.pattern('[a-zA-Z .]+'),
                Validators.minLength(2),
                Validators.maxLength(25)
            ]),
            apellido: new FormControl(null, [
                Validators.required,
                Validators.pattern('[a-zA-Z .]+'),
                Validators.minLength(2),
                Validators.maxLength(25)
            ]),
            estado: new FormControl(null, Validators.required),
            fecha: new FormControl(null, Validators.required),
            genero: new FormControl(null, Validators.required),
            username: new FormControl(null, [
                Validators.required,
                Validators.pattern('[a-zA-Z.0-9-_]+'),
                Validators.minLength(4),
                Validators.maxLength(15)
            ]),
            tipo: new FormControl(null, Validators.required),
            telefono: new FormControl(null, [Validators.required, Validators.pattern('[0-9]{10}')])
        });

        this.codeForm = new FormGroup({
            code: new FormControl(null, [Validators.required, Validators.pattern('[0-9]{6}')])
        });

    }

    // Si hay un usuario activo, no deberia de estar en esta página
    ngOnInit(): void {
        this.authService.getUsuarioConectado().pipe(tap(), first()).toPromise().then((user: any) => {
            if (user) { this.authService.navigate('home'); }
        });
    }

    // Navegamos al link indicado
    navigate(link: string) {
        this.router.navigate([link]);
    }

    // Es llamado cuando se envía el formulario completo
    async submitSignUpForm() {

        // Lo único que no puedo verificar antes de envíar el formulario es el teléfono, pero eso se arregla con el if de abajo
        if (this.signUpForm.valid) {

            const appVerifier = this.windowRef.recaptchaVerifier;
            const num = '+52' + this.telefono.value;

            // Verificamos si ya existe un usuario con este número, no queremos borrarle la información
            const exists = await this.firestoreService.getNumeroExists(num);
            if (exists) {
                this.errorTelefono = "Ya existe este número en el sistema Chambapp, no puede registrarse de nuevo";
                return;
            }

            // Si no existe quitamos el error (en caso de que haya tenido uno)
            this.errorTelefono = "";

            this.authService.signInWithPhoneNumber(num, appVerifier)
                .then(result => {
                    this.windowRef.confirmationResult = result;
                    this.step++;
                })
                .catch(error => console.log(error));

        } else { this.telefonoEditado = true; }

    }

    // Es llamado para enviar el código de SMS
    async submitCodeForm() {

        if (this.codeForm.valid) {

            this.loading = true;

            await this.windowRef.confirmationResult
                .confirm(this.code.value)
                .then(async (result: any) => {

                    await this.authService.updateProfile({
                        displayName: this.nombre.value,
                        photoURL: 'https://firebasestorage.googleapis.com/v0/b/chambapp-d909d.appspot.com/o/monitousuario.png?alt=media&token=52451894-7024-44c4-8aba-d5ce2774fe36'
                    })?.then();

                    const nuevoUsuario: User = {
                        nombre: this.nombre.value,
                        apellido: this.apellido.value,
                        estado: this.estado.value,
                        fecha: this.fecha.value,
                        genero: this.genero.value,
                        username: this.username.value,
                        tipo: this.tipo.value,
                        telefono: "+52" + this.telefono.value,
                        calificacion: 0,
                        photoURL: 'https://firebasestorage.googleapis.com/v0/b/chambapp-d909d.appspot.com/o/monitousuario.png?alt=media&token=52451894-7024-44c4-8aba-d5ce2774fe36'
                    }

                    await this.firestoreService.putUser(nuevoUsuario)
                        .then((result: any) => {
                            if (this.tipo.value == 's') {
                                this.navigate('create-service');
                            } else {
                                this.navigate('home');
                            }
                        })
                        .catch((error: any) => console.log('Hubo un error al subir la información a firebase'))

                })
                .catch((error: any) => {
                    if (error.code == 'auth/invalid-verification-code') {
                        this.errorSMS = "El código ingresado es incorrecto.";
                    }
                    console.log(error, 'Incorrect code entered')
                });
        }

    }

    // Función que se manda a llamar para ver si un campo fue editado
    keyUp(campo: string) {
        switch (campo) {
            case 'nombre': this.nombreEditado = true; break;
            case 'apellido': this.apellidoEditado = true; break;
            case 'username': this.usernameEditado = true; break;
            case 'telefono': this.telefonoEditado = true; break;
            case 'code': this.codeEditado = true; break;
        }
    }

    // Verificar si el username esta disponible
    checkUsername() {
        const exists = this.firestoreService.getUsernameExists(this.username.value);
        console.log('Exists', exists);
    }

    // GETS
    get nombre() { return this.signUpForm.get('nombre'); }
    get apellido() { return this.signUpForm.get('apellido'); }
    get estado() { return this.signUpForm.get('estado'); }
    get fecha() { return this.signUpForm.get('fecha'); }
    get genero() { return this.signUpForm.get('genero'); }
    get username() { return this.signUpForm.get('username'); }
    get tipo() { return this.signUpForm.get('tipo'); }
    get telefono() { return this.signUpForm.get('telefono'); }
    get code() { return this.codeForm.get('code'); }

    // Get que nos permite desactivar los botones si los campos no son válidos
    get signUpFormDisabled() {
        switch (this.step) {
            case 0: return this.nombre.valid && this.apellido.valid && this.estado.valid;
            case 1: return this.fecha.valid && this.genero.valid && this.username.valid && this.tipo.valid;
            case 2: return false;
            case 3: return this.code.valid;
            default: return false;
        }
    }

    // Mostramos diferentes campos del formulario con cada paso
    async cambiarPaso(adelante: boolean) {

        // Esta en el paso del username
        if (this.step == 1) {
            // Comprobamos que el username este disponible
            const exists = await this.firestoreService.getUsernameExists(this.username.value);
            // Si existe entonces no lo dejamos avanzar y le informamos del error
            if (exists) {
                this.errorUsername = "Este nombre de usuario ya existe, por favor elija otro nombre de usuario"
                return;
            }
        }

        // Sumamos o restamos el paso
        adelante ? this.step++ : this.step--;

        // Esta en el paso de llenar el número de teléfono
        if (this.step == 2) {

            // Quitamos error de username en caso de que existiera uno
            this.errorUsername = "";

            setTimeout(() => {
                // Obtenemos la referencia de la ventana y dibujamos el reCaptcha
                this.windowRef = this.windowService.getWindowRef();
                this.windowRef.recaptchaVerifier = this.authService.recaptchaVerifier();
                this.windowRef.recaptchaVerifier.render();
            }, 0);
        }

    }

}
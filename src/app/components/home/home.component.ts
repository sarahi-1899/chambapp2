import { FirestoreService } from './../../services/firebase/firestore.service';
import { AuthService } from './../../services/firebase/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap, first } from 'rxjs/operators';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    constructor(
        private router: Router,
        private authService: AuthService,
        private firestore: FirestoreService
    ) { }

    ngOnInit(): void {
        this.authService.getUsuarioConectado().pipe(tap(), first()).toPromise().then((user: any) => {
            if (user) { this.authService.navigate('loggedin'); }
        });
    }

    navigate(link: string) { this.router.navigate([link]); }

}

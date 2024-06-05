/* Este es un ejemplo de menu para el proyecto
mas que nada para recordar como funcionan las rutas en angular */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-menu-example',
    templateUrl: './menu-example.component.html',
    styleUrls: ['./menu-example.component.css']
})
export class MenuExampleComponent implements OnInit {

    constructor(private router: Router) { }

    ngOnInit(): void {
    }

    navigate(link: string) {
        this.router.navigate([link]);
    }

}

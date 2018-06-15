import {ModuleWithProviders} from '@angular/core';
import {Route, RouterModule} from '@angular/router';

import { AppComponent } from '../app.component';
import { PageNotFoundComponent } from '../components/page-not-found/page-not-found.component';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';

const appRoutes = [
    {
        path:"login",
        component: LoginComponent,
        useAsDefault: true
    },
    {
        path:"",
        redirectTo: '/login',
        pathMatch:'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: '**', 
        component: PageNotFoundComponent
    }
];

export const routing: ModuleWithProviders =  RouterModule.forRoot(appRoutes);


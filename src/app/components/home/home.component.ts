import { Component } from '@angular/core';
import {Router} from '@angular/router'

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent{

  constructor(private _router:Router) { }

  logout(){
    window.localStorage.removeItem('auth_key');
    this._router.navigate(['login'])
  }
  
}

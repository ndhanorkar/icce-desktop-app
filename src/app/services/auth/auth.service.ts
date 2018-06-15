import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import {ElectronService} from 'ngx-electron';

// @Injectable()
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  isLoggedIn: boolean;
  // store the URL so we can redirect after logging in
  redirectUrl: string;
  authorize: any
  
  constructor(private _http:Http, private _electronService: ElectronService) {
  }

  loginfn(){
    // headers.append('Content-Type', 'application/X-www-form-urlencoded');
    // if(this._electronService.isElectronApp) {
    //   this.authorize = this._electronService.ipcRenderer.send( "authorize", {} );
    //   console.log(this.authorize);
    // }

    this.authorize = this._electronService.ipcRenderer.send( "authorize", {} );  
  }

  // loginfn(usercreds){
  //   this.isLoggedIn = false;
  //   var headers =  new Headers();
  //   // var creds =  'name='+ usercreds.username + '&password='+ usercreds.password;
  //   var creds =  { credentials : {
  //     email: usercreds.email,
  //     password: usercreds.password
  //   }}
  //   headers.append('Content-Type', 'application/X-www-form-urlencoded');

  //   return new Promise((resolve) => {
      
  //     // this._http.post('http://staging.getcnergy.com/api/session', creds, {headers}).subscribe((data) => {
  //     //   if(data.json().success){
  //     //     window.localStorage.setItem('auth_key', data.json().access_token);
  //     //     console.log(data.json())
  //     //     this.isLoggedIn = true;
  //     //     resolve(this.isLoggedIn);
  //     //   }
  //     // })
  //     window.localStorage.setItem('auth_key', "123456");
  //     this.isLoggedIn = true;
  //     resolve(this.isLoggedIn);
  //   })
  // }
}
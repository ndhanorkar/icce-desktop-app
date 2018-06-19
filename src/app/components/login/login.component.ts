import { Component, NgZone } from '@angular/core';
import {AuthService} from '../../services/auth/auth.service'
import {Router} from '@angular/router';
import {ElectronService} from 'ngx-electron';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  providers: [AuthService],
  styleUrls: ['./login.component.css']
})

export class LoginComponent{

  appName: String;
  page: String;
  isLoadingPage: boolean;

  constructor(private _service: AuthService, private _router: Router, private _electronService: ElectronService, private _ngZone: NgZone){
    this.appName = 'ICCE';
    this.page = "login";
    this.isLoadingPage = false;
  }
 
  login() {
    this.isLoadingPage = true;
    this._service.loginfn()

    const ipc = this._electronService.ipcRenderer;
    ipc.on("loginResponse", (event, userObj) => {
      // ngZone use because angulare don't get changes for its variable.
      // these tasks can reenter the Angular zone via run.
      this._ngZone.run(() => {

        // loading completed.
        this.isLoadingPage = false;          
        
        // if user exist redirecting to home page.
        if(userObj.Id){
          localStorage.setItem('auth_key', userObj.Id);
          localStorage.setItem('Handle', userObj.Identity.Handle);
          this._router.navigate(['home'])
        }else{          
          // redirecting to different retry pages.
          this.page = (this.page == "login") ? "try1" : "try2" ;
          console.log("Error in login..", userObj)
        }                   
      });
    })

  }
      

}

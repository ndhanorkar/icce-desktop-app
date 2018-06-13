import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth/auth.service'
import {Router} from '@angular/router';
import {ElectronService} from 'ngx-electron';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  providers: [AuthService],
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  
  appName: String;

  constructor(private _service: AuthService, private _router: Router, private _electronService: ElectronService){
    this.appName = 'ICCE';
  }
 
  login(){

    this._service.loginfn()    

    const ipc = this._electronService.ipcRenderer;
    ipc.on("loginResponse", (event, userObj) => {
      
      // if user exist redirecting to home page.
      if(userObj){
        localStorage.setItem('auth_key', userObj.Id);
        console.log("redirecting to =",userObj)
        this._router.navigate(['home'])
      }else{
        console.log("Error in login..")
        this._router.navigate(['loginerror'])
      }      
    })

  }


  do_proceed(){
          
  }

  ngOnInit() {
  }

}

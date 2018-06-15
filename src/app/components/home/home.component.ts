import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {ElectronService} from 'ngx-electron';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent{

  constructor(private _router:Router, private _electronService: ElectronService) { 
    
  }

  logout(){
    
    this._electronService.ipcRenderer.send( "logout", {} );     
    const ipc = this._electronService.ipcRenderer;


    ipc.on("logoutResponse", (event, resObj) => {
      console.log("in logoutResponse", resObj);

      if(resObj == "success"){
        localStorage.removeItem('auth_key');
        this._router.navigate(['login']);       
      }else{
        console.log("error", resObj);
      }
    })
  } 
  
}

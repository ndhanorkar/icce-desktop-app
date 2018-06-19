import { Component, NgZone } from '@angular/core';
import {Router} from '@angular/router';
import {ElectronService} from 'ngx-electron';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent{
  handle:string;
  constructor(private _router:Router, private _electronService: ElectronService, private _ngZone: NgZone) { 
    this.handle =  localStorage.getItem("Handle");
  }

  logout(){
    
    this._electronService.ipcRenderer.send( "logout", {} );     
    const ipc = this._electronService.ipcRenderer;

    ipc.on("logoutResponse", (event, resObj) => {
      
      // ngZone use because angulare don't get changes for its variable.
      // these tasks can reenter the Angular zone via run.
      this._ngZone.run(() => {       
        console.log("in logoutResponse", resObj);

        if(resObj == "success"){
          localStorage.clear();
          this._router.navigate(['login']);       
        }else{
          console.log("error", resObj);
        }
      })
    })
  }
 
}

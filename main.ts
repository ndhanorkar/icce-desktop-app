"use strict";

// set up local environment
const dotenv = require('dotenv')
const result = dotenv.config()

if (result.error) {
  throw result.error
}

const electron = require("electron");
const path = require("path");
// const reload = require("electron-reload");
const isDev = require("electron-is-dev");
var Ghost = require("./client/ghost");
var GMessage = require("./client/gmessage");
var authorize = require("./client/auth");

import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import * as url from 'url';

let mainWindow = null;
let serve;

const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

// if (isDev) {
// 	const electronPath = path.join(__dirname, "node_modules", ".bin", "electron");
// 	reload(__dirname, { electron: electronPath });
// }



function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  });

  if (serve) {
    console.log("serve")
    // require('electron-reload')(__dirname, {
    //  electron: require(`${__dirname}/node_modules/electron`)});
    mainWindow.loadURL('http://localhost:4200');
  } else {
    console.log("not serve")
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // mainWindow.loadURL( `file://${ __dirname }/index.html` );
  // mainWindow.loadURL( `http://localhost:4200` );  

  if ( isDev ) {
      mainWindow.webContents.openDevTools();
  }
  mainWindow.once( "ready-to-show", () => {
     mainWindow.show();
 } );
  mainWindow.on( "closed", () => {
      mainWindow = null;
  } );

}


app.on( "ready", createWindow );
app.on( "window-all-closed", () => {
    if ( process.platform !== "darwin" ) {
        app.quit();
    }
} );
app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.on( "show-dialog", ( e, arg ) => {
    const msgInfo = {
        title: "My App Alert",
        message: arg.message,
        buttons: [ "OK" ]
    };
    dialog.showMessageBox( msgInfo );
} );

var ghost:any = {}
var buf:any;
var GhostMsgGenus:any;
var msgCounter = 10000

ipcMain.on( "authorize", (e, arg )=> {
  authorize('marketplaceservice', 'ICCE-Desktop')
  .then(function(result){
    ghost = result
    console.log("Full ghost object:", ghost)
    console.log("authorization complete, got user:", ghost.user)
    // socket will be a ghost connection with user information
    // should it also have a tether communication object
    // ghost can also send a GMessage
    mainWindow.webContents.send("loginResponse", ghost.user)
    //
    // ghost is an event emitter:
    // you must handle errors
    ghost.on('error', function(msg){
      console.log("ghost error:", msg.body.error)
    })
    ghost.on('closed', function(msg){
      console.log("ghost closed:", msg)
    })
    ghost.on('System.Stats', function(response){
        console.log("System:Stats:", response)
    })
    ghost.on('Open.Xfer', function(response){
      console.log("Open.Xfer:", response)
    })
    ghost.on('Open.Sell', function(response){
      console.log("Open.Sell:", response)
    })
    ghost.on('Open.Buy', function(response){
      console.log("Open.Buy:", response)
    })
    ghost.on('Open.Txn', function(response){
      console.log("Open.Txn:", response)
    })
    ghost.on('Update.Statistics', function(response){
      console.log("Update.Statistics:", response)
    })
    //
  })
  .catch(function(err){
    mainWindow.webContents.send("loginResponse", err);

    console.log("unable to authorize marketplaceserivce:", err)
  })
})


ipcMain.on("logout", (e, arg) => {
  try{
    ghost.close()
    mainWindow.webContents.send("logoutResponse", "success");
  }catch(err){
    console.log("logout error: ",err);
    mainWindow.webContents.send("logoutResponse", err);
  }
})
// stats is an example of a request (rather than send)
// which returns a Promise. requests require the msgCounter
// be provided as an argument, so that ghost can match the
// request with the response.
// Increment the msgCounter so it can be used in the next request
ipcMain.on("stats", (e, arg) => {
  var msg = new GMessage()
  var args = {"id":ghost.user.Id}
  buf = msg.request("System", "Stats", GhostMsgGenus.MAP, msgCounter, args)
  ghost.request(buf, msgCounter++).then(function(response){
    console.log("System Stats response:", response)
  }).catch(function(err){
    console.log("System Stats request got error:", err)
  })
})

// fees is another example of a request
ipcMain.on("fees", (e, arg) => {
  var msg = new GMessage()
  var args = {"id":ghost.user.Id}
  buf = msg.request("System", "Fees", GhostMsgGenus.MAP, msgCounter, args)
  ghost.request(buf, msgCounter++).then(function(response){
    console.log("System Fees response:", response)
  }).catch(function(err){
    console.log("System Fees request got error:", err)
  })
})

// balance is another example of a request
ipcMain.on("balance", (e, arg) => {
  var msg = new GMessage()
  var args = {"id":ghost.user.Id}
  buf = msg.request("System", "Balance", GhostMsgGenus.MAP, msgCounter, args)
  ghost.request(buf, msgCounter++).then(function(response){
    console.log("System Balance response:", response)
  }).catch(function(err){
    console.log("System Balance request got error:", err)
  })
})

// accounts is another example of a request
ipcMain.on("accounts", (e, arg) => {
  var msg = new GMessage()
  var args = {"id":ghost.user.Id}
  buf = msg.request("User", "ACHAccounts", GhostMsgGenus.MAP, msgCounter, args)
  ghost.request(buf, msgCounter++).then(function(response){
    console.log("User ACHAccounts response:", response)
  }).catch(function(err){
    console.log("User ACHAccounts request got error:", err)
  })
})

// buyMarket is an example of a "sent" message
// it will result in multiple callbacks representing the
// state of the buyMarket transaction. These multiple states
// are captured in the ghost.on("Open.BUY"....) style of
// asynchronous callbacks
ipcMain.on("buyMarket", (e, arg) => {
  var commission = 0.05
  var amount = 10
  var proceeds = (amount + (amount * commission)) * 100
  var args = {
    "buyer":ghost.user.Id,
    "tokens": amount.toString(),
    "proceeds": proceeds.toString(),
    "debitToken": ghost.user.Id,
    "from": "MARKETPLACE",
    "auth":"tokenFromTether"
  }
  var msg = new GMessage()
  buf = msg.request("Order", "Buy", GhostMsgGenus.MAP, -1, args)
  ghost.send(buf)
  //
})

ipcMain.on("sellMarket", (e, arg) => {
  var amount = 10
  var args = {
    "seller": ghost.user.Id,
    "tokens": amount.toString(),
    "account": "wells",
    "to": "MARKETPLACE",
    "auth": "tokenFromTether"
  }
  var msg = new GMessage()
  buf = msg.request("Order", "Sell", GhostMsgGenus.MAP, -1, args)
  ghost.send(buf)

})

ipcMain.on("buyTreasury", (e, arg) => {
  var commission = 0.00
  var amount = 10
  var proceeds = (amount + (amount * commission)) * 100
  var args = {
    "buyer":ghost.user.Id,
    "tokens": amount.toString(),
    "proceeds": proceeds.toString(),
    "debitToken": ghost.user.Id,
    "from": "TREASURY",
    "auth":"tokenFromTether"
  }
  var msg = new GMessage()
  buf = msg.request("Order", "Buy", GhostMsgGenus.MAP, -1, args)
  ghost.send(buf)
})

ipcMain.on("sellTreasury", (e, arg) => {
  var amount = 10
  var args = {
    "seller": ghost.user.Id,
    "tokens": amount.toString(),
    "account": "wells",
    "to": "TREASURY",
    "auth": "tokenFromTether"
  }
  var msg = new GMessage()
  buf = msg.request("Order", "Sell", GhostMsgGenus.MAP, -1, args)
  ghost.send(buf)
})


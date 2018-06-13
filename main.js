"use strict";

// set up local environment
const dotenv = require('dotenv')
const result = dotenv.config()

if (result.error) {
  throw result.error
}

const electron = require("electron");
const path = require("path");
const reload = require("electron-reload");
const isDev = require("electron-is-dev");
var Ghost = require("./client/ghost");
var GMessage = require("./client/gmessage");
var authorize = require("./client/auth");

const { app, BrowserWindow, ipcMain, dialog } = electron;
let mainWindow = null;

if (isDev) {
	const electronPath = path.join(__dirname, "node_modules", ".bin", "electron");
	reload(__dirname, { electron: electronPath });
}

app.on( "window-all-closed", () => {
    if ( process.platform !== "darwin" ) {
        app.quit();
    }
});

app.on( "ready", () => {
    mainWindow = new BrowserWindow( { width: 600, height: 600 } );
    // mainWindow.loadURL( `file://${ __dirname }/index.html` );
    mainWindow.loadURL( `http://localhost:4200` );
    if ( isDev ) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.once( "ready-to-show", () => {
       mainWindow.show();
    } );
    mainWindow.on( "closed", () => {
        mainWindow = null;
    } );
} );

ipcMain.on( "show-dialog", ( e, arg ) => {
    const msgInfo = {
        title: "My App Alert",
        message: arg.message,
        buttons: [ "OK" ]
    };
    dialog.showMessageBox( msgInfo );
} );

var ghost = {}

ipcMain.on( "authorize", (e, arg )=> {
  authorize('marketplaceservice', 'ICCE-Desktop')
  .then(function(result){
    ghost = result
    console.log("authorization complete, got user:", ghost.user)
    // socket will be a ghost connection with user information
    // should it also have a tether communication object
    // ghost can also send a GMessage
    var msg = new GMessage()
    var args = {"id":ghost.user.Id}
    buf = msg.request("System", "Stats", GhostMsgGenus.MAP, -1, args)
    ghost.send(buf)

    mainWindow.webContents.send("loginResponse", ghost.user)

    //
    // ghost is an event emitter:
    // you must handle errors
    ghost.on('error', function(msg){
      console.log("ghost error:", msg.body.error)
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
    //if no response from the server - may be any any connection issue from iphone
    mainWindow.webContents.send("loginResponse", null)
    console.log("unable to authorize marketplaceserivcce:", err)
  })
})

ipcMain.on("stats", (e, arg) => {
  var msg = new GMessage()
  var args = {"id":ghost.user.Id}
  buf = msg.request("System", "Stats", GhostMsgGenus.MAP, -1, args)
  ghost.send(buf)
})

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
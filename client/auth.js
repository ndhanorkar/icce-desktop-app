
const Ghost = require("./ghost")
const GMessage = require("./gmessage")
const PeerTalk = require("./pt")
const gdirectory = require("./gdirectory")
var msgpack = require("msgpack")

const pType = global.PeerTalkType
const appID = "59373aaabf8bbf802500020a"

function authorizeUserFor(authToken, app, ghost, resolve, reject){
  var peerTalk = new PeerTalk()
  var ignoreFirstData = false
  peerTalk.then((tether) => {
    if (tether === undefined){
      reject("unable to access tether")
    }
    console.log("authorizeUserFor:sending:", authToken)
    var auth = {
      app: app,
      catalogID: appID,
      connectID: authToken.replace(".", ":")
    }
    //var msg = msgpack.pack({authToken:authToken})
    //var packed = msgpack.pack({auth:authToken, err:"Passprt Authorization Failue"})
    console.log("auth:", auth)
    var packed = msgpack.pack(auth)
    tether.emit("send", {type:pType.AUTH, body:packed})

    tether.on("data", (data) => {
      if ( ignoreFirstData === true ){
        ignoreFirstData = false
        return
      }
      // 4. Recieve User (or error) from tethered mobile device
      var buf = Buffer.from(data)
      var msg = msgpack.unpack(buf)
      if ( msg.err === undefined ){
        // 5. Connect User to GhostConn
        ghost["user"] = msg
        ghost["tether"] = tether
        resolve(ghost)
      } else {
        reject(msg.err)
      }
    })
    tether.on("closed", () => {
      console.log("tether closed, exiting....")
      reject("tether closed")
    })
  })
  .catch((err) => {
    reject(err)
  })
}

var authorize = function(serviceName, appName, callback){
  return new Promise(function(resolve, reject){
    // 0. open PeerTalk, returns an EventEmitter

    // 1. Directory:Lookup marketplaceservice
    gdirectory.lookup(serviceName)
    .then(function(server){
      requestConnect(server)
    }, function(err) {
      reject(err)
    })
    // 2. Request connect from marketplaceservice
    var requestConnect = function(server){
      //console.log("requestConnect:server:", server)
      var ghost = new Ghost();

      ghost.on('connect', function(msg){
        console.log("authorize got connect:", msg)
        // 3. Send connect ID to tethered mobile Device
        authorizeUserFor(msg.selector, appName, ghost, resolve, reject)
      })
      ghost.on('error', function(err){
        console.log("got an error at top level from ghost:", err)
        reject(err)
      })
      ghost.on('close', function(err){
        console.log("got close from top level from ghost:", err)
        reject(err)
      })
      var server = server[serviceName].split(":")
      ghost.connect(server[0], server[1], process.env.CERTS)
    }
  })
}

module.exports = authorize

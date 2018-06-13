var Ghost = require("./ghost")
var GMessage = require("./gmessage")

/**
var lookup = function(catalog, callback){

}
**/

var lookup = function(catalog){
  return new Promise(function(resolve, reject){
    var ghost = new Ghost();
    ghost.on('Directory.LookupService', function(response){
      if('marketplaceservice' in response){
        resolve(response)
      } else {
        reject(new Error(response.error))
      }
    })
    ghost.on('ready', function(msg){
      var msg = new GMessage()
      buf = msg.request("Directory", "Lookup", GhostMsgGenus.ARRAY, 1001, ['marketplaceservice'])
      ghost.send(buf)
    })
    ghost.on('error', function(err){
      console.log("got an error at top level from ghost:", err)
      reject(err)
    })
    ghost.on('close', function(err){
      console.log("got close from top level from ghost:", err)
      reject(err)
    })
    ghost.connect(process.env.REGISTRY_HOST, process.env.REGISTRY_PORT, process.env.CERTS)
  })
}
module.exports = {lookup: lookup}

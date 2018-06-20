
const Promise = require('promise')
const tls = require('tls');
const fs = require('fs');
const GMessage = require("./gmessage")
const EventEmitter = require('events');

class Ghost extends EventEmitter {
  constructor(){
    super()
    this.ready = false
    this.socket = {}
    this.options = {
        rejectUnauthorized:true,
        requestCert:true,
        checkServerIdentity: function(serverName, cert){
          var fp = fs.readFileSync(this.certsPath + '/marketplace.fingerprint', 'utf8')
          fp = fp.slice(0, fp.length - 1)
          if (fp !== cert.fingerprint) {
            return new Error("ServerIdentity does not match fingerprint")
          }
          //console.log("ServerIdentity matches")
        }
    }
  }

  connect(host, port, certs){
    var ghost = this
    this.options.host = host
    this.options.port = port
    this.options.ca = fs.readFileSync(certs + '/ca.crt'),
    this.options.key = fs.readFileSync(certs + '/ca.key.pem'),
    this.options.cert = fs.readFileSync(certs + '/ca.crt.pem'),
    this.options.certsPath = certs
    this.socket = tls.connect(this.options, () => {
        //console.log('client connection is ',
        //    this.socket.authorized ? 'authorized' : 'unauthorized');
    })

    this.socket.on('error', function(err){
      console.log('ghost error:', err)
      ghost.emit('error', err)
    })

    this.socket.on('data', function(data){
      ghost.parse(data)
    })
    return this
  }

  close(){
    this.socket.destroy()
    this.tether.tunnel.end()
    this.emit("closed", "ghost is closed")
  }

  send(message){
    //console.log("Ghost.send:", message)
    this.socket.write(message)
  }

  request(message, msgid){
    var ack = this
    return new Promise(function(resolve, reject){
      ack.socket.write(message)
      ack.on("response.message", function(response){
        //console.log("message sequence:", msgid, " response sequence:", response.msgid)
        if (response.msgid === msgid){
          resolve(response.body)
        }
      })
    })
  }

  parse(data){
    if (!this.socket.authorized){
      return
    }
    var buf = new Buffer(data)
    // first msg should be a
    var msg = new GMessage()
    msg.decode(buf)
    //console.log("ghost.parse:", msg)
    switch(msg.msgType){
      case global.GhostMsgType.PONG:
        if (this.ready === false){
          this.ready = true
          this.emit("ready")
        }
        break;
      case global.GhostMsgType.RES_MSG:
        var b = msg.body
        if ('target' in b && 'behavior' in b) {
          this.emit(b.target + '.' + b.behavior, b)
        } else {
          this.emit("response.message", msg)
        }
        break;

      case global.GhostMsgType.REQ_MSG:
        //console.log("ghost.emiting REQ_MSG:msg:", msg)
        this.emit(msg.selector, msg.body)
        break;

      case global.GhostMsgType.CONNECT:
        this.emit("connect", msg)
        break;

      case global.GhostMsgType.ERR_MSG:
        this.emit("error", msg)
        break;

      default:
        console.log("undefined msg:", msg.msgType)
        this.emit("error", new Error("undefined msg"))
    }
  }
}

module.exports = Ghost;

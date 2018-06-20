const utf8 = require("utf8");
const events = require("events");
const usbmux = require("usbmux");
const bufferpack = require("bufferpack");

global.PeerTalkType =  {
 STRING : 101,
 MSGPACK : 104,
 AUTH : 107,
 OPENBUY : 108,
 OPENSELL : 109,
 OPENXFER : 110,
 OPENTXN : 111,
 CLOSETXN : 112,
 COMPLETEXFER : 113,
 BEARERERROR : 114,
}

const pType = global.PeerTalkType

encode = function(type, body) {
  var msg = new Buffer(20 + body.length)
  // header
  msg.writeUInt32BE(1, 0)
  msg.writeUInt32BE(type, 4)
  msg.writeUInt32BE(0, 8)


  if (type === pType.STRING){
    // selector
    msg.writeUInt32BE(body.length+4, 12)
    msg.writeUInt32BE(body.length, 16)
    var buf = Buffer.from(body, 'utf8');
    buf.copy(msg, 20, 0, buf.length)
  } else if (type >= pType.AUTH){
    msg.writeUInt32BE(body.length, 12)
    body.copy(msg, 16, 0, body.length)
  }

  return msg
}

function PeerTalk(options, port) {
    if(!port || typeof port !== "number") port = "2345";
         event = new events.EventEmitter();
          console.log("listening on ", port);
        return usbmux.getTunnel(port, options).then((tunnel) => {
          console.log("got tunnel...")
            event.on("send", (msg) => {
              //console.log("PeerTalk:send:", msg)
              if ( msg.type === pType.STRING){
                mp = encode(pType.STRING, msg.body)
                //console.log("mp:", mp)
                tunnel.write(mp)
                //console.log("finished writing some shit")
                //msg = utf8.encode(msg.body);
                //tunnel.write(bufferpack.pack("! I I I I", [1,101,0,msg.length+4]));
                //console.log("bp:", bufferpack.pack("! I I I I", [1,101,0,msg.length+4]))
                //tunnel.write(bufferpack.pack(`! I ${msg.length}s`, [msg.length, msg]));
                //console.log("bp:", bufferpack.pack(`! I ${msg.length}s`, [msg.length, msg]))

              } else if ( msg.type >= pType.AUTH ) {
                //console.log("fuck!!!! msgpack:", msg.body.length)
                //var fuck = msg.body.toString('utf8')
                //tunnel.write(bufferpack.pack("! I I I I", [1,101,0,fuck.length+4]));
                //tunnel.write(bufferpack.pack(`! I ${fuck.length}s`, [fuck.length, fuck]));
                //console.log("mp:", msg)
                mp = encode(msg.type, msg.body)
                tunnel.write(mp)
                //console.log("wrote msgpack on tunnel")
              } else {
                console.log("WTF:", msg)
              }
            });

            tunnel.on("error", (error) =>{
              console.log("tunnel got error:", error)
            })

            tunnel.on("close", () =>{
              console.log("tunnel closed")
              event.emit("closed")
            })

            tunnel.on("data", (data) => {
                const size = bufferpack.unpack("! I I I I", data)[3];
                //console.log("PeerTalk:data:size:", size)
                event.emit("data", data.slice(data.length - size));
            });
            // need tunnel to close connection from app
            event["tunnel"] = tunnel
            return event;
        })
        .catch(function(err){
          console.log("usbmux tunnel error:", err)
        });
}

module.exports = PeerTalk;


const utf8 = require("utf8");
const events = require("events");
const usbmux = require("usbmux");
const bufferpack = require("bufferpack");

const port = 2345;

function incoming(tunnel, data){
  const size = bufferpack.unpack("! I I I I", data)[3];
  msg =  data.slice(data.length - size).toString()
  console.log("tunnel received:", msg)
  // echo it back plus
  echo = utf8.encode("echo:" + "foo");
  tunnel.write(bufferpack.pack("! I I I I", [1,101,0,echo.length+4]));
  tunnel.write(bufferpack.pack(`! I ${echo.length}s`, [echo.length, echo]));
}

function closed(tunnel) {
  console.log("tunnel closed should restart listener eh?")
}

// listener detects connection from mobile device
var listener = usbmux.createListener()
  .on('attached', function(udid) {
    console.log('Device attached: %s', udid)
    // createTunnel returns an event EventEmitter
    createTunnel(udid, incoming, closed);
  })
  .on('detached', function(udid) {
    console.log('Device detached: %s', udid);
  })
  .on('error', function(err) {
    console.log(err);
  });

// createTunnel creates the PeerTalk socket with the Device
// If it can't connect (catch) waits 2 seconds and attempts to connect again
function createTunnel(udid, incoming, close) {
  const event = new events.EventEmitter();
  usbmux.getTunnel(port, {udid: udid}) // <-- with udid
    .then(function(tunnel) {
      // tunnel is just a net.Socket connection to the device port
      // you can write / .on('data') it like normal
      //console.log('Tunnel created on %s', udid, incoming);

      tunnel.on('data', (data) => {
          incoming(tunnel, data)
      });

      tunnel.on('close', () => {
        close(tunnel)
      })
    })
    .catch(function(err) {
      console.log(err);
      // wait one second
      setTimeout(createTunnel, 2000, udid, incoming, closed)
    });
}

module.exports = Tether;

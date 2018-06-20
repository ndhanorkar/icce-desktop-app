var Struct = require('struct')
var msgpack = require("msgpack")

global.GhostMsgGenus =  {
  IDENTITY: 1,
  CONTEXT: 2,
  CONTENT: 3,
  PRIMITIVE: 4,
  SUBJECT: 5,
  OBJECT: 6,
  STACK: 7,
  USER: 8,
  COLLECTION: 9,
  CATALOG: 10,
  MAP: 11,
  REQUEST_ARGS: 12,
  ARRAY: 13,
  MITTO: 14,
  STREAM: 15,
  APP: 16,
  LASTGGENUS: 17
}

global.GhostMsgType = {
  OBJ_MSG: 1,
  REQ_MSG: 2,
  RES_MSG: 3,
  ERR_MSG: 4,
  NOTICE_MSG: 5,
  PING: 6,
  PONG: 7,
  STREAM_MSG: 8,
  CONNECT: 9,
  FILL_MSG: 10,
  LASTGMSG: 11,
}

var msgCount = 1

function gmessage(obj) {
  if (!(this instanceof gmessage)){
    return new gmessage(obj)
  }
  if (obj === undefined) {
    return this
  }
  this.msgType = obj.msgType
  this.genus = obj.genus
  this.selector = obj.selector
  if (obj.msgid > 0){
    this.msgid = obj.msgid
  } else {
    this.msgid = msgCount++
  }

  this.body = obj.body
}

gmessage.prototype.encode = function() {
  var msg = new Buffer(12 + this.selector.length + this.body.length)
  // header
  msg.writeInt8(this.msgType, 0)
  msg.writeInt8(this.genus, 1)
  msg.writeInt16LE(this.selector.length, 2)
  msg.writeInt32LE(this.msgid, 4)
  msg.writeInt32LE(this.body.length, 8)

  // selector
  this.selector.copy(msg, 12, 0, this.selector.length)

  // body
  this.body.copy(msg, 12 + this.selector.length, 0, this.body.length)

  return msg
}

gmessage.prototype.decode = function(buf){
  //console.log('decode:buf:', buf)
  this.msgType = buf.readInt8(0)
  this.genus = buf.readInt8(1)
  var sLen = buf.readInt16LE(2)
  this.msgid = buf.readInt32LE(4)
  var bLen = buf.readInt32LE(8)

  //console.log("gmessage.decode:type:", this.msgType, " sLen:", sLen, " bLen:", bLen)

  if (sLen > 0){
    this.selector = buf.toString('utf8', 12, sLen+12)
  }
  if (bLen > 0){
    var body = Buffer.allocUnsafe(bLen)
    buf.copy(body, 0, 12 + sLen)
    this.body = msgpack.unpack(body)
  }
  //console.log("gMessage:decode:", this)
}

gmessage.prototype.request = function(behavior, target, genus, msgid, args){
    var selector = new Buffer(target + '.' + behavior, "utf-8")
    var body = msgpack.pack(args)

    var msg = new gmessage({selector:selector, genus:genus, msgid:msgid, msgType:global.GhostMsgType.REQ_MSG})
    msg.selector = selector
    msg.body = body
    //console.log("GMessage.request:", msg.msgid)
    return msg.encode()
}

gmessage.prototype.response = function(genus, msgid, args){
  console.log("gmessage.response not implemented")
}
gmessage.prototype.error = function(msg, msgid){
  console.log("gmessage.response not implemented")
}

module.exports = gmessage

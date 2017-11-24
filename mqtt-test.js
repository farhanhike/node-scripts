var mqtt = require('mqtt')

// NormalizedNumber+":"+apiversion+”:”+autosubscribe+”:”+pushforcereconnect+”:”+fastreconnect

// staging
// var clientId = '+918375988189:0:true:1:1'
// var host = 'tcp://10.0.1.35:2883'
// var options = {
//   clientId: clientId,
//   username: "VdX_2Q1EL1PckLeQ",
//   password: "tYiGRQ5fFkc=",
//   rejectUnauthorized: true
// }
console.log("loaded")

var clientId = '+919953753342:0:true:1:1'
var host = 'tcp://10.0.1.35:2883'
var options = {
  clientId: clientId,
  username: "Wc30IA1EL1UxUl_f",
  password: "VXpRjHuPk3A=",
  rejectUnauthorized: true
}

// var clientId = '+919953753342:4:true'
// var host = 'tcp://10.15.0.154:2883'
// var options = {
//   clientId: clientId,
//   username: "WhMpU_VczAATizJN",
//   password: "VoWY_2x1c3A=",
//   rejectUnauthorized: false
// }

var client = mqtt.connect(host, options)

client.on('error', function (err) {
  console.log("Connection Error" , err)
  client.end()
})

client.on('connect', function () {
  console.log('client connected:' + clientId)
})

client.subscribe('WhMpU_VczAATizJN/s', { qos: 1 })

client.publish('WhMpU_VczAATizJN/s', JSON.stringify({"to":"+919953753342","d":{"ts":Date.now(),"i":2,"sm":"Helsadlo11"},"t":"m"}), { qos: 1, reatin:true}, function(error, val) {
  if(error) {
    console.log("Publish Error", error)
  }
  else {
    console.log(val)
  }
})

client.on('message', function (topic, message, packet) {
  console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
})

client.on('close', function () {
  console.log(clientId + ' disconnected')
})

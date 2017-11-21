var mqtt = require('mqtt')

// NormalizedNumber+":"+apiversion+”:”+autosubscribe+”:”+pushforcereconnect+”:”+fastreconnect

// staging
var clientId = '+918375988189:0:true:1:1'
var host = 'tcp://mqtt.im.hike.in:1883'
var options = {
  clientId: clientId,
  username: "VdX_2Q1EL1PckLeQ",
  password: "tYiGRQ5fFkc=",
  rejectUnauthorized: true
}

// var clientId = "+919953753342:0:true:1:1"
// var host = 'tcp://mydev:1883'
// var options = {
//   clientId: clientId,
//   username: "WhMpU_VczAATizJN",
//   password: "VoWY_2x1c3A=	",
//   rejectUnauthorized: true
// }

var client = mqtt.connect(host, options)

client.on('error', function (err) {
  console.log("called" , err)
  client.end()
})

client.on('connect', function () {
  console.log('client connected:' + clientId)
})

client.subscribe('topic', { qos: 1 })

client.publish('topic', 'mqtt connection demo...!', { qos: 0, retain: false })

client.on('message', function (topic, message, packet) {
  console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
})

client.on('close', function () {
  console.log(clientId + ' disconnected')
})

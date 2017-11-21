var mqtt = require('mqtt')

// NormalizedNumber+":"+apiversion+”:”+autosubscribe+”:”+pushforcereconnect+”:”+fastreconnect
var clientId = '+919953753342:0:true:1:1'
var host = 'tcp://mqtt.im.hike.in:1883'

// var options = {
//     clientId: clientId,
//     username: "VdX_2Q1EL1PckLeQ",
//     password: "tYiGRQ5fFkc=",
//     rejectUnauthorized: false
// }
var options = {
  keepalive: 10,
  clientId: clientId,
  protocolId: 'TCP',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: 'WillMsg',
    payload: 'Connection Closed abnormally..!',
    qos: 0,
    retain: false
  },
  username: "VdX_2Q1EL1PckLeQ",
  password: "tYiGRQ5fFkc=",
  rejectUnauthorized: false
}

var client = mqtt.connect(host, options)

client.on('error', function (err) {
  console.log(err)
  client.end()
})

client.on('connect', function () {
  console.log('client connected:' + clientId)
})

client.subscribe('topic', { qos: 0 })

client.publish('topic', 'wss secure connection demo...!', { qos: 0, retain: false })

client.on('message', function (topic, message, packet) {
  console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
})

client.on('close', function () {
  console.log(clientId + ' disconnected')
})

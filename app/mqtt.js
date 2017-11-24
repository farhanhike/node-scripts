// Create a client instance
client = new Paho.MQTT.Client("10.0.1.35", Number(2883), "+919953753342:0:true:1:1");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({userName: "VdX_2Q1EL1PckLeQ",password: "tYiGRQ5fFkc="});

// called when the client connects
client.onConnect = function() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("/World");
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = "/World";
    client.send(message);
}

client.subscribe('WhMpU_VczAATizJN/s', { qos: 1 })

client.publish('WhMpU_VczAATizJN/s', JSON.stringify({"to":"+919953753342","d":{"ts":Date.now(),"i":2,"sm":"Helsadlo11"},"t":"m"}), { qos: 1, reatin:true}, function(error, val) {
  if(error) {
    console.log("Publish Error", error)
  }
  else {
    console.log(val)
  }
})

// called when the client loses its connection
function onConnectionLost(responseObject) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
}

// called when a message arrives
function onMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
}
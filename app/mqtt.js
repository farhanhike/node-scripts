// Create a client instance
client = new Paho.MQTT.Client("52.76.190.255", Number(8080), "+919953753342:0:true:1:1");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({userName: "Wc30IA1EL1UxUl_f",password: "VXpRjHuPk3A=	="});

// called when the client connects
client.onConnect = function() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("Wc30IA1EL1UxUl_f/s", { qos: 1 });
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = "Wc30IA1EL1UxUl_f/s";
    client.send(message);
}

// client.subscribe('Wc30IA1EL1UxUl_f/s', )

// client.publish('Wc30IA1EL1UxUl_f/s', JSON.stringify({"to":"+919953753342","d":{"ts":Date.now(),"i":2,"sm":"Helsadlo11"},"t":"m"}), { qos: 1, reatin:true}, function(error, val) {
//   if(error) {
//     console.log("Publish Error", error)
//   }
//   else {
//     console.log(val)
//   }
// })

// called when the client loses its connection
function onConnectionLost(responseObject) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
}

// called when a message arrives
function onMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
}
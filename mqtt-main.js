"use strict";

var mqtt = require('mqtt')

exports.getClient = (options) => {
    var clientId = '+918375988189:0:true:1:1'
    var host = 'tcp://10.0.1.35:2883'
    var options = {
      clientId: clientId,
      username: "VdX_2Q1EL1PckLeQ",
      password: "tYiGRQ5fFkc=",
      rejectUnauthorized: true
    }
    var client = mqtt.connect(host, options)
    return client;
}

exports.test = () => {
    console.log("Yeah browserify")
}
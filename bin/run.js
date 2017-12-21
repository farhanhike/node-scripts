'use strict';

const sticker = require('../server/sticker');
const http = require('http');
const argv = require('yargs').argv

let query = {}
let limit = null;

if(argv.lcid) {
    query['lcid'] = {$in : argv.lcid.trim().split(',')}
}
else if(argv.lsid) {
    query['lsid'] = {$in : argv.lsid.trim().split(',')}
}
else if(argv.stickerId) {
    query['stickerId'] = {$in: argv.stickerId.trim().split(',')}
}
if(argv.limit) {
    limit = argv.limit
}
sticker.init(query, limit);

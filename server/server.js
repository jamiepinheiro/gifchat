
const config = require('./config/config');
const https = require('https');
const http = require('http');

const express = require('express');
const socketIO = require('socket.io');
const schedule = require('node-schedule');

//const mongoose = require('./db/mongoose');
//const {Message} = require('./models/message');
const {Rooms} = require('./utils/rooms');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var rooms = new Rooms();
var port = process.env.PORT || 3000;

app.use(express.static('public'));

//socket.io
io.on('connection', (socket) => {

    socket.on('join', (params) => {
        socket.join(params.room);
        rooms.joinRoom(params.room, socket.id);
    });

    socket.on('disconnect', () => {
        rooms.leaveRoom(socket.id);
    });

});

// api routes
app.get('/newRoom', async (req, res) => {
    res.send(`/chat.html?room=${rooms.findRoomToJoin()}`);
});

app.get('/gifs', async (req, res) => {
    var search = req.query.search;

    https.request({
        method : 'GET',
        hostname : 'api.cognitive.microsoft.com',
        path : '/bing/v7.0/images/search?count=4&imageType=AnimatedGif&q=' + encodeURIComponent(search),
        headers : {
            'Ocp-Apim-Subscription-Key' : process.env.BING_API_KEY
        }
    }, (response) => {
        var body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            try {
                body = JSON.parse(body).value.map((item) => {return {name: search, url: item.contentUrl}});
                res.send(body);
            } catch (e) {
                res.status(404).send(body);
            }

        });
        response.on('error', function (e) {
            res.status(400).send(e.message);
        });
    }).end();
});

var hourlyJob = schedule.scheduleJob('0 * * * *', () => {
  console.log('The answer to life, the universe, and everything!');
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

var express = require('express');
var bodyParser = require('body-parser');
var gameLogic = require('./game-logic');
var app = express();
var path = require('path');
const gridCount = 4;
let firstMoveDone = false;
let startNodeRegistered = false;
let GAME_OVER = false;
global.endPoints = []; //for tracking the points where a new line can begin
let currentPlayer = 1;
let startNodePoint = {};
global.gameMovePoints = []; //updated for every valid complete move and holds all the nodes of line
global.gameDiagonalLines = []; // all diagonal lines for checking line crosses at non-node points
let response = {};

let INITIALIZE = {
    "msg": "INITIALIZE",
    "body": {
        "newLine": null,
        "heading": "Player 1",
        "message": "Awaiting Player 1's Move"
    }
};
let VALID_START_NODE = {
    "msg": "VALID_START_NODE",
    "body": {
        "newLine": null,
        "heading": "Player  ", //add player later
        "message": "Select a second node to complete the line."
    }
};
let INVALID_START_NODE = {
    "msg": "INVALID_START_NODE",
    "body": {
        "newLine": null,
        "heading": "Player ", //add player later
        "message": "Not a valid starting position."
    }
};
let VALID_END_NODE = {
    "msg": "VALID_END_NODE",
    "body": {
        "newLine": {
            "start": {}, //add start later
            "end": {}    //add end later
        },
        "heading": "Player ",
        "message": null
    }
};
let INVALID_END_NODE = {
    "msg": "INVALID_END_NODE",
    "body": {
        "newLine": null,
        "heading": "Player ", //add player later
        "message": "Invalid move!"
    }
};


app.use(express.static('./'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
  }));
// parse application/json
app.use(bodyParser.json())


app.options('/node-clicked', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.send(204);
});

app.get('/initialize', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    response = JSON.parse(JSON.stringify(INITIALIZE));
    resetGame();
    res.send(response);
    console.log(response);
});
app.post('/node-clicked', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (!GAME_OVER) //do nothing if game is over
    {
        if (!startNodeRegistered && !firstMoveDone) //1st move start point
        {
            response = JSON.parse(JSON.stringify(VALID_START_NODE));
            response.body.heading += currentPlayer;
            startNodeRegistered = true;
            console.log(req.body);
            startNodePoint = JSON.parse(JSON.stringify(req.body));   
            
        }
        else if (!startNodeRegistered && firstMoveDone) //not the 1st move so check the new point matches either of the current end points
        {
            if (gameLogic.validStartNode(req.body, endPoints)) {
                startNodeRegistered = true;
                startNodePoint = JSON.parse(JSON.stringify(req.body));
                response = JSON.parse(JSON.stringify(VALID_START_NODE));
                response.body.heading += currentPlayer;
            }
            else {
                response = JSON.parse(JSON.stringify(INVALID_START_NODE));
                response.body.heading += currentPlayer;
            }
        }
        else if (startNodeRegistered) //1st point already registered, now check the end point.
        {
            response = JSON.parse(JSON.stringify(VALID_END_NODE));
            response.body.newLine.start = JSON.parse(JSON.stringify(startNodePoint));
            response.body.newLine.end = JSON.parse(JSON.stringify(req.body));
            response.body.heading += currentPlayer;
            currentPlayer = (currentPlayer % 2) + 1;
            startNodeRegistered = false;
            
            if (gameLogic.addAllPoints(startNodePoint, req.body, gameMovePoints, gameDiagonalLines) !== -1) // add all the points of the new line or report invalid line
            {
                firstMoveDone = true;

                gameLogic.updateEndPoints(startNodePoint, req.body, endPoints);

                if (gameLogic.isGameOver(endPoints[0], endPoints[1], gameMovePoints, gridCount)) {
                    GAME_OVER = true;
                    response.msg = "GAME_OVER";
                    response.body.heading = "Game Over"
                    response.body.message = "Player " + currentPlayer; //The other player won
                }
            }
            else {
                currentPlayer = (currentPlayer % 2) + 1; //refer back to the current player
                response = JSON.parse(JSON.stringify(INVALID_END_NODE));
                response.body.heading += currentPlayer;
            }
        }
        res.send(response);
    }
});

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.listen(8080, function () {
    console.log("API Running");
});

function resetGame() {
    GAME_OVER = false;
    firstMoveDone = false;
    currentPlayer = 1;
    startNodePoint = {};
    endPoints.length = 0;
    gameMovePoints.length = 0;
    gameDiagonalLines.length = 0;
}
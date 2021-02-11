var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var gameLogic = require('./logic');

app.use(express.static(path.join(__dirname, 'client')));

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

app.get('/gameLogic.INITIALIZE', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    response = JSON.parse(JSON.stringify(gameLogic.INITIALIZE));
    gamelogic.resetGame();
    res.send(response);
    console.log(response);
});
app.post('/node-clicked', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    if (!gameLogic.GAME_OVER) //do nothing if game is over
    {
        if (!startNodeClicked && !gameLogic.firstMoveDone) //1st move start point
        {
            response = JSON.parse(JSON.stringify(gameLogic.VALID_START_NODE));
            response.body.heading += gameLogic.currentPlayer; 
            startNodeClicked = true;
            console.log(req.body);
            gameLogic.startPoint = JSON.parse(JSON.stringify(req.body));   
            
        }
        else if (!startNodeClicked && gameLogic.firstMoveDone) //not the 1st move so check the new point matches either of the current end points
        {
            if (gameLogic.isValidStartNode(req.body, endPoints)) {
                startNodeClicked = true;
                gameLogic.startPoint = JSON.parse(JSON.stringify(req.body));
                response = JSON.parse(JSON.stringify(gameLogic.VALID_START_NODE));
                response.body.heading += gameLogic.currentPlayer;
            }
            else {
                response = JSON.parse(JSON.stringify(gameLogic.INVALID_START_NODE));
                response.body.heading += gameLogic.currentPlayer;
            }
        }
        else if (startNodeClicked) //1st point already clicked, now check the end point.
        {
            response = JSON.parse(JSON.stringify(gameLogic.VALID_END_NODE));
            response.body.newLine.start = JSON.parse(JSON.stringify(gameLogic.startPoint));
            response.body.newLine.end = JSON.parse(JSON.stringify(req.body));
            response.body.heading += gameLogic.currentPlayer;
            gameLogic.currentPlayer = (gameLogic.currentPlayer % 2) + 1;
            startNodeClicked = false;
            

            if (gameLogic.calculateAll(gameLogic.startPoint, req.body, gameMovePoints, gameDiagonalLines) !== -1) // add all the points of the new line or report invalid line
            {
                gameLogic.firstMoveDone = true;

                gameLogic.updateEndPoints(gameLogic.startPoint, req.body, endPoints);

                if (gameLogic.isGameOver(endPoints[0], endPoints[1], gameMovePoints, gridCount)) {
                    gameLogic.GAME_OVER = true;
                    response.msg = "gameLogic.GAME_OVER";
                    response.body.heading = "Game Over!!"
                    response.body.message = `Player ${gameLogic.currentPlayer}lost`; //The other player won
                    console.log(response);
                }
            }
            else {
                gameLogic.currentPlayer = (gameLogic.currentPlayer % 2) + 1; //refer back to the current player
                response = JSON.parse(JSON.stringify(gameLogic.INVALID_END_NODE));
                response.body.heading += gameLogic.currentPlayer;
            }
        }
        res.send(response);
    }
});

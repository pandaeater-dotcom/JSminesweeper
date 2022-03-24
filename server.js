const express = require('express');
const app = express();
app.use(express.json());
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/minesweeper', {useNewUrlParser:true, useUnifiedTopology:true})
    .then(() => {
        console.log("MongoDB Connected.")
    })
    .catch(err => {
        console.log("Error:\n", err);
    })

const playerSchema = new mongoose.Schema({
    username: String,
    password: String,
    highScores: {
        type: Map,
        of: Number
    }
});
const Player = mongoose.model('Player', playerSchema);

// require('dotenv').config()
// users = []

app.set('view engine', 'ejs')

app.use(express.static('assets/'));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', async (req, res) => {
    const user = await Player.find({username: req.body.username});
    if (user.length == 0) {
        const user = await getEncrypted(req);
        user.highScores = {};
        const player = new Player(user);
        player.save();
        res.redirect(308, '/game');
    }
    else try {
        const check = await bcrypt.compare(req.body.password, user[0].password);
        if (check) {
            res.redirect(308, '/game');
        }
    } catch (e) {
        res.status(500).send();
    }
})

app.post('/game', (req, res) => {
    res.render('index', {gridSize: req.body.gridSize, username: req.body.username});
})

app.post('/result', (req, res) => {
    Player.find({username: req.body.username})
        .then((data) => {
            const gridSize = `${req.body.gridSize}`;
            const scores = data[0].highScores;
            if (!(gridSize in scores) || (scores[gridSize] > req.body.seconds)) {
                scores.set(gridSize, req.body.seconds);
                Player.updateOne({username: req.body.username}, {highScores: scores})
            }
        })
    console.log(req.body);
})

app.get('/', (req, res) => {
    res.render('main');
})

async function getEncrypted (req) {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const user = { username : req.body.username, password: hashedPassword };
        return user;
    } catch (e) {
        console.log(e);
    }
}

app.listen(3000);
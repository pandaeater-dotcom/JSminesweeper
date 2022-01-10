let gameOn = false;
let gameOver = false;
let numFlags = 0;
let timer;
let min = 0;
let sec = 0;

function initBoard() {
    grid = document.querySelector('.grid');
    const squareList = []
    const bombRatio = 15;
    let square;
    const gridSize = 6;
    const gridWidth = 36*gridSize+4*(gridSize);
    grid.style.width = `${gridWidth}px`;
    grid.style.height = `${gridWidth}px`;
    document.querySelector('#heading').style.width = `${gridWidth}px`;

    const bombCount = Math.floor(bombRatio/100*gridSize*gridSize);
    document.querySelector('#counter').innerHTML = `0/${bombCount} | <img src='minesweeperflag.png' id='counterflag'>`;
    for (let i = 0; i < gridSize*gridSize; i++) {
        square = document.createElement('div');
        square.setAttribute('id', `s${i}`);
        grid.append(square);
        squareList.push(square);
    }
    
    square = document.querySelector('#s0');
    square.style.borderRadius = '15px 5px 5px 5px';
    square = document.querySelector(`#s${gridSize-1}`);
    square.style.borderRadius = '5px 15px 5px 5px';
    square = document.querySelector(`#s${gridSize*(gridSize-1)}`);
    square.style.borderRadius = '5px 5px 5px 15px';
    square = document.querySelector(`#s${gridSize*gridSize-1}`);
    square.style.borderRadius = '5px 5px 15px 5px';

    const vals = []
    for (let i = 0; i < bombCount; i++) {
        let randVal = Math.floor(Math.random()*(squareList.length-1));
        while (vals.includes(randVal)) {
            randVal = Math.floor(Math.random()*(squareList.length-1));
        }
        vals.push(randVal);
        square = document.querySelector(`#s${randVal}`);
        square.classList.add('bomb');
    }
    for (let square of squareList) if (!square.classList.contains('bomb')) {
        square.classList.add('safe');
        proxBomb(square, squareList);
    }
    return squareList;
}

function proxBomb(square, squareList) {
    let count = 0;
    for (let adj of validAdj(square, squareList)) if (adj.classList.contains('bomb')) count++;
    if (count != 0) square.setAttribute('data', count);
}

function takeGridSize() {
    form = document.querySelector('form');
    input = document.querySelector('input');
    let alreadyWrong = false;
    const error = document.querySelector('#errorMessage');
    input.addEventListener('keydown', function(e) {
        if (e.code === 'Enter') {
            e.preventDefault();
            if (!Number.isInteger(parseInt(input.value))) {
                if (!alreadyWrong) error.classList.toggle('hidden');
                alreadyWrong = true;
                input.value = '';
            }
            else {
                if (alreadyWrong) error.classList.toggle('hidden');
                input.value = '';
                console.log('sent');
                return input.value;
            }
        }
    });
}

function runGame(squareList) {
    grid = document.querySelector('.grid');
    for (let square of squareList) {
        square.addEventListener('mousedown', e => {
            if (!gameOver) {
                if (!gameOn) {
                    gameOn = true;
                    timer = setInterval(() => stopWatch(), 1000);
                };
                if (e.which === 1) clicked(square, squareList);
                else if (e.which === 3) {
                    rclicked(square, squareList);
                    if (winCheck(squareList)) {
                        gameWon(square, squareList);
                        return;
                    }
                }
            }
        })
    }
}

function gameLost(square, squareList) {
    gameOver = true;
    const bombList = [];
    square.innerHTML = "<img src='minesweeperbomb.png'></img>";
    square.style.backgroundColor = 'rgb(175, 0, 0)';
    for (let square of squareList) if (square.classList.contains('bomb')) bombList.push(square);
    for (let i = 0; i < bombList.length; i++) setTimeout(() => {
        bombList[i].innerHTML = "<img src='minesweeperbomb.png'></img>";
        bombList[i].style.backgroundColor = 'rgb(175, 0, 0)';
    }, 180*i);
    document.querySelector('#menuTitle').innerText = 'Game Over!';
    document.querySelector('#outcome').innerText = 'You Lost :(';  
    togglePopup();
    clearInterval(timer);
}

function gameWon(square, squareList) {
    gameOver = true;
    shortcutClicked(square, squareList);
    document.querySelector('#menuTitle').innerText = 'Game Over!';
    document.querySelector('#outcome').innerText = 'You Won!';  
    togglePopup();
    const time = document.createElement('h1');
    time.innerHTML = `Your Time: <span id='score'>${document.querySelector('#timer').innerHTML}</span>`;
    setInterval(() => document.querySelector('#score').classList.toggle('blink'), 500);
    document.querySelector('.content').insertBefore(time, document.querySelector('.buttons'));
    clearInterval(timer);
}
function clicked(square, squareList) {
    if (square.classList.contains('bomb')) {
        gameLost(square, squareList);
        return;
    }
    if (square.classList.contains('flag')) return;
    if (square.classList.contains('checked')) shortcutClicked(square, squareList);
    square.classList.add('checked');
    if (square.getAttribute('data') && square.getAttribute('data') != 'flagged') square.innerHTML = `<span>${square.getAttribute('data')}</span>`;
    explore(square, squareList);
}

function validAdj(square, squareList) {
    const validSquares = [];
    const gridSize = parseInt(Math.sqrt(squareList.length));
    const index = parseInt(square.getAttribute('id').slice(1));
    const leftEdge = index % gridSize === 0;
    const rightEdge = index % gridSize === gridSize-1;
    const adjacentIndexes = [[-1, 'l'], [-gridSize-1, 'l'], [-gridSize, 'n'], [-gridSize+1, 'r'], [1, 'r'], [+gridSize+1, 'r'], [+gridSize, 'n'], [+gridSize-1, 'l']];
    for (let i of adjacentIndexes) {
        let adj = squareList[index+i[0]];
        if (adj && !(leftEdge && i[1] === 'l') && !(rightEdge && i[1] === 'r')) validSquares.push(adj);
    }
    return validSquares;
}

function explore(square, squareList) {
    if (square.getAttribute('data')) return;
    for (let adj of validAdj(square, squareList)) {
        if (!adj.classList.contains('bomb') && adj.getAttribute('data') && adj.getAttribute('data') != 'flagged') {
            adj.innerHTML = `<span>${adj.getAttribute('data')}</span>`;
            adj.classList.add('checked');                    
        }
        else if (!adj.classList.contains('bomb') && !adj.classList.contains('checked')) {
            adj.classList.add('checked');
            setTimeout(() => explore(adj, squareList), 90);
        }
    }
}

function rclicked(square, squareList) {
    if (square.classList.contains('checked')) return;
    if (square.classList.contains('flagged')) {
        square.classList.remove('flagged');
        numFlags--;
        square.innerHTML = ``;
        const index = parseInt(square.getAttribute('id').slice(1));
        proxBomb(squareList, index);
        updateFlagCounter(squareList);
        return;
    }
    numFlags++;
    square.classList.add('flagged');
    square.setAttribute('data', 'flagged');
    square.innerHTML = `<img src='minesweeperflag.png'></img>`;
    updateFlagCounter(squareList);
}

function shortcutClicked(square, squareList) {
    let adjFlags = 0;
    const valid = validAdj(square, squareList);

    if (square.getAttribute('data') === 'flagged') {
        for (adj of valid) {
            if (adj.getAttribute('data') != 'flagged') {
                adj.classList.add('checked');
                if (adj.getAttribute('data')) adj.innerHTML = `<span>${adj.getAttribute('data')}</span>`;    
            }
        }
        return;
    }

    for (let adj of valid) {
        if (adj.classList.contains('flagged') && !adj.classList.contains('bomb')) {
            gameLost(adj, squareList);
            return;
        }
        else if (adj.classList.contains('flagged') && adj.classList.contains('bomb')) adjFlags++;
    }
    if (adjFlags === parseInt(square.getAttribute('data'))) for (let adj of valid) {
        if (!(adj.classList.contains('flagged') || adj.classList.contains('bomb'))) {
            adj.classList.add('checked');
            if (adj.getAttribute('data')) adj.innerHTML = `<span>${adj.getAttribute('data')}</span>`;
            else explore(adj, squareList); 
        }
    }
}

function winCheck(squareList) {
    let bombCount = 0;
    for (let square of squareList) {
        if (square.classList.contains('bomb')) {
            bombCount++;
            if (!square.classList.contains('flagged')) return false;
        }
    }
    if (numFlags === bombCount) return true;
    return false;
}

function stopWatch() {
    sec++;
    if (sec === 60) {
        sec = 0;    
        min++;
    }
    if (min < 10 && sec < 10) document.querySelector('#timer').innerHTML = `0${min}:0${sec}`;
    else if (min < 10) document.querySelector('#timer').innerHTML = `0${min}:${sec}`;
    else if (sec < 10) document.querySelector('#timer').innerHTML = `${min}:0${sec}`;
    else document.querySelector('#timer').innerHTML = `${min}:${sec}`;
}

function updateFlagCounter(squareList) {
    let bombCount = 0;
    for (square of squareList) {
        if (square.classList.contains('bomb')) bombCount++;
    }
    document.querySelector('#counter').innerHTML = `${numFlags}/${bombCount} | <img src='minesweeperflag.png' id='counterflag'>`;
}

function togglePopup() {
    document.querySelector('.popup').classList.toggle('active');
}

runGame(initBoard());
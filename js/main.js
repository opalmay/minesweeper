'use strict';
const MINE = '💣';
const FLAG = '🚩';
const LIVES = '❤';

const SMILEY = {
    NORMAL: '😀',
    DEAD: '🤯',
    WIN: '😎'
}

var gBoard;
var gRandomCells;
var gLevel = {
    SIZE: 9,
    MINES: 10
};
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3
}
var gTimerInterval;

function initGame() {
    clearInterval(gTimerInterval);//
    gGame.isOn = true;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.lives = 3;
    gRandomCells = [];
    buildBoard();
    renderBoard();
    setSmileyState(SMILEY.NORMAL);
    gTimerInterval = setInterval(gameTimer, 1000);
    //todo set level
}
function gameTimer() {

}
function buildBoard() {
    gBoard = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        gBoard[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isFlagged: false
            }
            gBoard[i][j] = cell;
            gRandomCells.push(cell);
        }
    }
}
function setMinesNegsCount(cellI, cellJ) {
    var cell = gBoard[cellI][cellJ];
    if (cell.isMine) return;
    var minesCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === cellI && j === cellJ) continue;
            if (gBoard[i][j].isMine) minesCount++;
        }
    }
    cell.minesAroundCount = minesCount;
}
function renderBoard() {
    var strHTML = '';
    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            strHTML += `<td onclick="cellClicked(this,${i},${j})" oncontextmenu="flagCell(event,this,${i},${j})"`
            if (cell.isShown) {
                strHTML += ` class="shown minesAround${cell.minesAroundCount}">`;
                if (cell.isMine) strHTML += MINE;
                else if (cell.minesAroundCount !== 0) strHTML += cell.minesAroundCount;
            } else if (cell.isFlagged) strHTML += '>' + FLAG;
            strHTML += '</td>'
        }
        strHTML += '</tr>'
    }
    // console.log(strHTML);
    var elTbody = document.querySelector('.board');
    elTbody.innerHTML = strHTML;
}
function flagCell(event, elCell, i, j) {
    if (!gGame.isOn) return;
    event.preventDefault();
    gBoard[i][j].isFlagged = !gBoard[i][j].isFlagged;
    // renderBoard();\
    renderCell(elCell, gBoard[i][j]);
}
function renderCell(elCell, cell) {
    if (cell.isShown) {
        elCell.classList.add(`shown`);

        if (cell.isMine) elCell.innerText = MINE;
        else if (cell.minesAroundCount !== 0) {
            elCell.innerText = cell.minesAroundCount;
            elCell.classList.add(`minesAround${cell.minesAroundCount}`);
        }
    }
    else if (cell.isFlagged) elCell.innerText = FLAG;
    else elCell.innerText = '';

}
function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    var cell = gBoard[i][j];
    if (cell.isFlagged) return;
    if (cell.isShown) return;
    if (gGame.shownCount === 0) {
        setMines(i, j);
    }
    if (cell.isMine) {
        cell.isShown = true;
        // gGame.lives--;
        updateLives(-1);
        renderCell(elCell, cell);
        checkLoss();
    } else {
        expandShown(i, j);
        checkWin();
        renderBoard();
    }
}
function setMines(cellI, cellJ) {
    gRandomCells = gRandomCells.sort(() => Math.random() - 0.5); //Shuffle to place mines
    for (var i = 0; i < gLevel.MINES; i++) {
        var cell = gRandomCells.pop();
        var indexes = findIndexesOfCell(cell);
        if (indexes.i === cellI && indexes.j === cellJ) {
            i--;
            continue;
        }
        cell.isMine = true;
    }
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            setMinesNegsCount(i, j);
        }
    }
    console.log(gBoard);
}
function checkWin() {
    if (gGame.shownCount === gLevel.SIZE * gLevel.SIZE - gLevel.MINES) gameOver(true);
}
function checkLoss() {
    if (gGame.lives === 0) gameOver(false);
}
function gameOver(isWin) {//todo
    gGame.isOn = false;
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) cell.isShown = true;
        }
    }
    var smiley = SMILEY.DEAD;
    if (isWin) smiley = SMILEY.WIN;
    clearInterval(gTimerInterval);
    setSmileyState(smiley);
}
function updateLives(diff) {
    gGame.lives += diff;
    var elLives = document.querySelector('.lives');
    elLives.innerText = LIVES.repeat(gGame.lives);
}
function expandShown(i, j) {
    var row = gBoard[i];
    if (!row) return;
    var cell = row[j];
    if (!cell) return;
    if (cell.isShown) return;
    if (cell.isMine) return;

    cell.isShown = true;
    gGame.shownCount++;

    if (cell.minesAroundCount === 0) {//todo change to loop
        expandShown(i - 1, j);
        expandShown(i + 1, j);
        expandShown(i, j - 1);
        expandShown(i, j + 1);
        expandShown(i - 1, j - 1);
        expandShown(i + 1, j + 1);
        expandShown(i - 1, j + 1);
        expandShown(i + 1, j - 1);
    }
}
function findIndexesOfCell(cell) {
    for (var i = 0; i < gBoard.length; i++) {
        var j = gBoard[i].findIndex(value => value === cell);
        if (j > -1) {
            return { i: i, j: j };
        }
    }
    return null;
}
function setSmileyState(smiley) {
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = smiley;
}
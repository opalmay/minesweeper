'use strict';
const MINE = '💣';
const FLAG = '🚩';
const LIVES = '❤';
const NO_LIVES = '💔';

const SMILEY = {
    NORMAL: '🙂',
    CAUTION: '😲',
    DEAD: '🤯',
    WIN: '😎'
};

const LEVELS = {
    BEGINNER: { SIZE: 4, MINES: 2 },
    INTERMEDIATE: { SIZE: 8, MINES: 12 },
    EXPERT: { SIZE: 12, MINES: 30 }
};

var gBoard;
var gUndoStack;
var gRandomCells;
var gStartTime;
var oneMouseKeyDown;
var gWaitingForSafeClick;
var gLevel = {
    SIZE: 4,
    MINES: 2
};
var gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    safeClicks: 3
}
var gTimerInterval;

function initGame() {
    clearInterval(gTimerInterval);
    gGame.isOn = true;
    oneMouseKeyDown = false;
    gGame.shownCount = 0;
    gStartTime = Date.now();
    gameTimer();
    gGame.markedCount = 0;
    gGame.lives = 3;
    gGame.safeClicks = 3;
    setSafeClickStringEl();
    gRandomCells = [];
    gWaitingForSafeClick = false;
    updateLives(0);
    buildBoard();
    renderBoard();
    setSmileyState(SMILEY.NORMAL);
    gUndoStack = [];
}
function undo() {
    if (gUndoStack.length === 0) return;
    if (!gGame.isOn) return;
    gBoard = gUndoStack.pop();
    renderBoard();
}
function gameTimer() {
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '⏳' + getTimeSinceStart() + 's';
}
function getTimeSinceStart() {
    return Math.round((Date.now() - gStartTime) / 1000);
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
    actOnNegs((cell) => {
        if (cell.isMine) minesCount++;
    }, cellI, cellJ);
    cell.minesAroundCount = minesCount;
}
function renderBoard() {
    var strHTML = '';
    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            strHTML += `<td onclick="cellClicked(this)"
            onmousedown="setCautionSmiley(event, true)" onmouseup="setCautionSmiley(event, false)"
            oncontextmenu="flagCell(event,this)" data-i="${i}" data-j="${j}"`;
            if (cell.isShown) {
                strHTML += ` class="shown minesAround${cell.minesAroundCount}">`;
                if (cell.isMine) strHTML += MINE;
                else if (cell.minesAroundCount !== 0) strHTML += cell.minesAroundCount;
            } else if (cell.isFlagged) strHTML += '>' + FLAG;
            else strHTML += '>';
            strHTML += '</td>'
        }
        strHTML += '</tr>'
    }
    var elTbody = document.querySelector('.board');
    elTbody.innerHTML = strHTML;
}
function flagCell(event, elCell) {
    var i = +elCell.dataset.i;
    var j = +elCell.dataset.j;
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
function cellClicked(elCell) {
    var i = +elCell.dataset.i;
    var j = +elCell.dataset.j;
    elCell.classList.remove(".safeClick")
    if (!gGame.isOn) return;
    var cell = gBoard[i][j];
    if (cell.isFlagged) return;
    if (cell.isShown) return;
    if (gGame.shownCount === 0) {
        setMines(i, j);
        // console.log(i,j)
        // gGame.isOn = true;
        gameTimer();
        gTimerInterval = setInterval(gameTimer, 1000);
    }
    gUndoStack.push(copyObjMat(gBoard));
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
    // console.log(gBoard);
}
function checkWin() {
    if (gGame.shownCount === gLevel.SIZE * gLevel.SIZE - gLevel.MINES) gameOver(true);
}
function checkLoss() {
    if (gGame.lives === 0) gameOver(false);
}
function gameOver(isWin) {
    gGame.isOn = false;
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) cell.isShown = true;
        }
    }
    var smiley = SMILEY.DEAD;
    if (isWin) {
        smiley = SMILEY.WIN;
        localStorage.setItem(gLevel.SIZE, getTimeSinceStart());
    }
    setSmileyState(smiley);
    clearInterval(gTimerInterval);
    gTimerInterval = null;
}
function updateLives(diff) {
    gGame.lives += diff;
    var elLives = document.querySelector('.lives');
    elLives.innerText = LIVES.repeat(gGame.lives);
    elLives.innerText += NO_LIVES.repeat(3 - gGame.lives);
}
function expandShown(cellI, cellJ) {
    var row = gBoard[cellI];
    if (!row) return;
    var cell = row[cellJ];
    if (!cell) return;
    if (cell.isShown) return;
    if (cell.isMine) return;

    cell.isShown = true;
    // renderCell(getCellByIndexes(cellI, cellJ), gBoard[cellI][cellJ]);
    gGame.shownCount++;

    if (cell.minesAroundCount === 0) {
        actOnNegs((cell, i, j) => expandShown(i, j), cellI, cellJ);
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
    var elSmiley = document.querySelector('.smiley button');
    elSmiley.innerText = smiley;
}
function setCautionSmiley(event, isCaution) {
    // if (event.type === 'mousedown') {
    //     if (oneMouseKeyDown) {

    //     }
    //     else oneMouseKeyDown = true;
    // } else oneMouseKeyDown = false;
    if (!gGame.isOn) return;
    if (event.which !== 1) return;
    if (isCaution) setSmileyState(SMILEY.CAUTION);
    else setSmileyState(SMILEY.NORMAL);
}
// function autoOpen(elCell, i, j) {
//     var cell = gBoard[i][j];
//     if(!cell.isShown) return;
//     if(getFlagsAround(i,j) === cell.minesAroundCount){
//         for (var i = cellI - 1; i <= cellI + 1; i++) {
//             if (i < 0 || i >= gBoard.length) continue;
//             for (var j = cellJ - 1; j <= cellJ + 1; j++) {
//                 if (j < 0 || j >= gBoard[i].length) continue;
//                 if (i === cellI && j === cellJ) continue;
//                 if (!gBoard[i][j].isFlagged) cellClicked();
//             }
//         }
//     }
// }
// function getFlagsAround(cellI, cellJ) {
//     var cell = gBoard[cellI][cellJ];
//     var flagsCount = 0;
//     for (var i = cellI - 1; i <= cellI + 1; i++) {
//         if (i < 0 || i >= gBoard.length) continue;
//         for (var j = cellJ - 1; j <= cellJ + 1; j++) {
//             if (j < 0 || j >= gBoard[i].length) continue;
//             if (i === cellI && j === cellJ) continue;
//             if (gBoard[i][j].isFlagged) flagsCount++;
//         }
//     }
//     return flagsCount;
// }
function setDifficulty(difficulty) {
    gLevel = difficulty;
    initGame();
}
function safeClick() {
    if (gWaitingForSafeClick || gGame.safeClicks === 0 || !gGame.isOn) return;
    gGame.safeClicks--;
    setSafeClickStringEl();
    var cell = gRandomCells.find(cell => !cell.isShown);
    var indexes = findIndexesOfCell(cell);

    var elCell = getCellByIndexes(indexes.i, indexes.j);
    elCell.classList.add("safeClick");
    gWaitingForSafeClick = true;
    setTimeout(() => {
        elCell.classList.remove("safeClick");
        gWaitingForSafeClick = false;
    }, 3000)
}
function setSafeClickStringEl(){
    var elSafeClicksLeft = document.querySelector('.spafeClicksLeft');
    elSafeClicksLeft.innerText = gGame.safeClicks;
}
function getCellByIndexes(i, j) {
    return document.querySelectorAll(`[data-i="${i}"]`)[j];
}

function actOnNegs(func, cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === cellI && j === cellJ) continue;
            func(gBoard[i][j], i, j);
        }
    }
}
function showHighScores() {
    var elModal = document.querySelector('.modal');
    if (!elModal.hidden) {
        elModal.hidden = true;
        return;
    }
    var beginnerScore = localStorage.getItem(LEVELS.BEGINNER.SIZE) ? localStorage.getItem(LEVELS.BEGINNER.SIZE) + 's' : '-';
    var intermediateScore = localStorage.getItem(LEVELS.INTERMEDIATE.SIZE) ? localStorage.getItem(LEVELS.INTERMEDIATE.SIZE) + 's' : '-';
    var expertScore = localStorage.getItem(LEVELS.EXPERT.SIZE) ? localStorage.getItem(LEVELS.EXPERT.SIZE) + 's' : '-';

    var highscores = 'Beginner: ' + beginnerScore +
        '\nIntermediate: ' + intermediateScore +
        '\nExpert: ' + expertScore;

    elModal.querySelector('h3').innerText = highscores;
    elModal.hidden = false;
}
function closeHighScores() {
    var elModal = document.querySelector('.modal');
    elModal.hidden = true;
}
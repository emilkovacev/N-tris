const score = document.getElementsByClassName("score")[0];
const level = document.getElementsByClassName("level")[0];
const stage = document.getElementsByClassName("stage")[0];

const cellWidth = 30;   // width/height in pixels
const stageWidth = 12;  // width in cells
const stageHeight = 22; // height in cells
let interval;

class Coor {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    isValid(): boolean {
        return this.x >= 0 && this.y >= 0 && this.x < stageWidth && this.y < stageHeight;
    }
    isBorder(): boolean {
        return this.x == 0 || this.y == 0 || this.x == stageWidth - 1 || this.y == stageHeight - 1;
    }
}

class Cell {
    readonly coor: Coor;
    readonly elem: HTMLElement | null;

    constructor(coor: Coor) {
        this.coor = coor;
        this.elem = document.querySelector(`[x='${this.coor.x}'][y='${this.coor.y}']`);
    }
    getCell(): HTMLElement | null {
        return this.elem;
    }
    isOccupied(): boolean {
        if (this.elem == null) {
            return false
        }
        return this.elem.getAttribute("status") == "occupied";
    }
    isActive(): boolean {
        if (this.elem == null) {
            return false
        }
        return this.elem.getAttribute("active") == "true";
    }
}

class Piece {
    readonly coor: Coor
    readonly color: string
    readonly cell: HTMLElement | null

    constructor(coor: Coor, color: string) {
        this.coor = coor;
        this.color = color;

        const cell: HTMLElement | null = new Cell(this.coor).getCell();
        this.cell = cell;
    }
    spawn(): boolean {
        const cell = this.cell;
        if (cell == null) {
            return false;
        }
        cell.classList.add("square");
        cell.setAttribute("status", "occupied");
        cell.style.backgroundColor = this.color;
        return true;
    }
    destroy() {
        const cell: HTMLElement | null = new Cell(this.coor).getCell()
        if (cell == null) {
            return false;
        }
        // const cellColor = cell.style.backgroundColor;
        cell.classList.remove("square");
        cell.style.backgroundColor = "transparent";
        cell.setAttribute("status", "free");

        // return {
        //     coor: this.coor, 
        //     color: cellColor, 
        //     status: 0
        // };

        return true;
    }
}

class Tetromino {
    shape: ReadonlyArray<Coor>
    readonly color: string
    height: number
    width: number
    pos: Coor

    constructor(pos: Coor, shape: ReadonlyArray<Coor>, color: string, height: number, width: number) {
        this.shape = shape;
        this.color = color;
        this.height = height;
        this.width = width;
        this.pos = pos;
    }
    spawn() {
        for (let coor of this.shape) {
            const i = coor.x
            const j = coor.y
            const piece = new Piece(
                new Coor(this.pos.x + i, this.pos.y + j), 
                this.color
            );
            const success = piece.spawn();

            if (!success) {
                return false;
            }
        }
        return true;
    }
    checkTranslate(posOffset: Coor): ReadonlyArray<Coor> {
        return this.shape.map((currPos) => new Coor(currPos.x + posOffset.x, currPos.y + posOffset.y));
    }
    private tryMove(direction: Coor) {
        const newShape = this.checkTranslate(direction);
        for (let coor of newShape) {
            const newCell = new Cell(coor);
            if (newCell.isOccupied() && !newCell.isActive()) {
                return false;
            }
        }
        return true;
    }
    tryMoveLeft() {
        return this.tryMove(new Coor(-1, 0));
    }
    tryMoveDown() {
        return this.tryMove(new Coor(0, 1));
    }
    tryMoveRight() {
        return this.tryMove(new Coor(1, 0));
    }
}

// pieces are sets of coordinates that form a shape, 
// starting from [0, 0] (top left of grid)
//
// TODO: write custom bounds check functions for each piece!
const tetrominoes = {
    I: {shape: [[0, 0], [0, 1], [0, 2], [0, 3]], color: "cyan"},
    J: {shape: [[0, 0], [0, 1], [1, 1], [2, 1]], color: "blue"},
    L: {shape: [[2, 0], [0, 1], [1, 1], [2, 1]], color: "orange"},
    O: {shape: [[0, 0], [1, 0], [0, 1], [1, 1]], color: "yellow"},
    S: {shape: [[1, 0], [2, 0], [0, 1], [1, 1]], color: "#0FFF50"},
    T: {shape: [[1, 0], [0, 1], [1, 1], [2, 1]], color: "purple"},
    Z: {shape: [[0, 0], [1, 0], [1, 1], [1, 2]], color: "red"}
}

function updateScore(newScore) {
    score.innerHTML = newScore;
}

function incrementLevel() {
    let currLevel = parseInt(level.innerHTML);
    level.innerHTML = currLevel + 1;
}

function getCell(x, y) {
    if (!validateCoor(x, y)) {
        return null;
    }
    const cell = document.querySelector(`[x='${x}'][y='${y}']`);
    return cell;
}

function cellIsOccupied(x, y) {
    const cell = getCell(x, y);
    return cell.getAttribute("status") == "occupied" && cell.getAttribute("active") != "true";
}

function setActive(t_name, x, y) {
    const {shape} = tetrominoes[t_name];
    for (let piece of shape) {
        const [i, j] = piece;
        const cell = getCell(x+i, y+j);
        cell.setAttribute("active", "true")
    }

}

function createCell(x, y) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("x", x);
    cell.setAttribute("y", y);
    cell.setAttribute("status", "free");
    cell.style.left = x * cellWidth + "px";
    cell.style.top = y * cellWidth + "px";
    stage.appendChild(cell);
    return 0;
}

function createBorderCell(x, y) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.classList.add("border-cell");
    cell.setAttribute("x", x);
    cell.setAttribute("y", y);
    cell.setAttribute("status", "occupied");
    cell.style.left = x * cellWidth + "px";
    cell.style.top = y * cellWidth + "px";
    stage.appendChild(cell);
    return 0;
}

function spawnPiece(x, y, color) {
    if (!validateCoor(x, y)) {
        return -1;
    }
    const cell = document.querySelector(`[x='${x}'][y='${y}']`)
    cell.classList.add("square");
    cell.setAttribute("status", "occupied");
    cell.style.backgroundColor = color;
    return 0;
}

function unspawnPiece(x, y) {
    if (!validateCoor(x, y)) {
        return -1;
    }
    const cell = document.querySelector(`[x='${x}'][y='${y}']`);
    const cellColor = cell.style.backgroundColor;
    cell.classList.remove("square");
    cell.style.backgroundColor = "transparent";
    cell.setAttribute("status", "free");
    return {x: x, y: y, color: cellColor, status: 0};
}

function spawnTetromino(t_name, x, y) {
    const {shape, color} = tetrominoes[t_name];
    for (let piece of shape.slice().reverse()) {
        const [i, j] = piece;
        const result = spawnPiece(x + i, y + j, color);
        if (result != 0) {
            return -1;
        }
    }
    return 0;
}

function checkMovePiece(x, y) {
    if (!validateCoor(x, y) || !validateCoor(x, y+1)) {
        return -1;
    }
    if (cellIsOccupied(x, y+1)) {
        return -1;
    }
    return 0;
}

function movePiece(x, y) {
    const {color, status: unspawnStatus} = unspawnPiece(x, y);
    const spawnStatus = spawnPiece(x, y+1, color);
    return 0;
}

function moveTetromino(t_name, x, y) {
    const {shape, color} = tetrominoes[t_name];
    for (let piece of shape.slice().reverse()) {
        const [i, j] = piece;
        const check = checkMovePiece(x+i, y+j);
        // console.log(check);
        // if (check != 0) {
        //     return -1;
        // }
    }
    for (let piece of shape.slice().reverse()) {
        const [i, j] = piece;
        movePiece(x+i, y+j);
    }
    return 0;
}

let currY = 0

function moveFirstTetromino() {
    const moveStatus = moveTetromino("I", 0, currY);
    currY += 1;
    if (moveStatus != 0) {
       clearInterval(interval) 
    }
}

function start() {
    console.log("Starting...");

    // initialize cells
    for (let x = 0; x < stageWidth + 2; x++) {
        for (let y = 0; y < stageHeight + 2; y++) {
            if (x == 0 || x == stageWidth + 1 || y == 0 || y == stageHeight + 1) {
                createBorderCell(x, y);
            } else {
                createCell(x, y);
            }
        }
    }
    spawnTetromino("I", 0, 0);
    spawnTetromino("J", 5, 0);
    spawnTetromino("L", 0, 5);
    spawnTetromino("O", 5, 5);
    spawnTetromino("S", 0, 10);
    spawnTetromino("T", 5, 10);
    spawnTetromino("Z", 0, 15);
    // moveTetromino("J", 0, 0);
    interval = window.setInterval(moveFirstTetromino, 500);
}
window.addEventListener("load", start)

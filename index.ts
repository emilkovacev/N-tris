const score = document.getElementsByClassName("score")[0];
const level = document.getElementsByClassName("level")[0];
const stage = document.getElementsByClassName("stage")[0];

const cellWidth = 30;   // width/height in pixels
const stageWidth = 12;  // width in cells
const stageHeight = 22; // height in cells

type Coor = [number, number];

class Cell {
    readonly coor: Coor;
    readonly elem: HTMLElement | null;

    constructor(coor: Coor) {
        this.coor = coor;
        const [x, y] = coor;
        this.elem = document.querySelector(`[x='${x}'][y='${y}']`);
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

        const cell: HTMLElement | null = new Cell(coor).getCell();
        this.cell = cell;
    }
    spawn(active: boolean = false): boolean {
        const cell = this.cell;
        if (cell == null) {
            return false;
        }
        cell.classList.add("square");
        cell.setAttribute("status", "occupied");
        cell.setAttribute("active", active.toString());
        cell.style.backgroundColor = this.color;
        return true;
    }
    destroy() {
        if (this.cell == null) {
            return false;
        }
        this.cell.classList.remove("square");
        this.cell.style.backgroundColor = "transparent";
        this.cell.setAttribute("status", "free");

        return true;
    }
}

class Tetromino {
    readonly letter: string
    shape: Coor[]
    readonly color: string
    height: number
    width: number
 
    private tetrominoes = {
        I: {shape: [[1, 1], [1, 2], [1, 3], [1, 4]], color: "cyan"},
        J: {shape: [[1, 1], [1, 2], [2, 2], [3, 2]], color: "blue"},
        L: {shape: [[3, 1], [1, 2], [2, 2], [3, 2]], color: "orange"},
        O: {shape: [[1, 1], [2, 1], [1, 2], [2, 2]], color: "yellow"},
        S: {shape: [[2, 1], [3, 1], [1, 2], [2, 2]], color: "#0FFF50"},
        T: {shape: [[2, 1], [1, 2], [2, 2], [3, 2]], color: "purple"},
        Z: {shape: [[1, 1], [2, 1], [2, 2], [2, 3]], color: "red"}
    }

    private get(letter: string) {
        return this.tetrominoes[letter];
    }

    constructor(letter: string) {
        this.letter = letter;
        const { shape, color } = this.get(letter);
        this.shape = shape;
        this.color = color;
    }
    spawn(origin: Coor = [1, 1]) {
        const [offset_x, offset_y] = origin;
        this.shape = this.translate([offset_x - 1, offset_y - 1]);
        for (let coor of this.shape) {
            const [x, y] = coor;
            const piece = new Piece([x, y], this.color);
            const success = piece.spawn();
            if (!success) {
                return false;
            }
        }
        return true;
    }
    destroy() {
        for (let coor of this.shape) {
            const [x, y] = coor;
            const piece = new Piece([x, y], this.color);
            const success = piece.destroy();
            if (!success) {
                return false;
            }
        }
        return true;
    }
    private translate(posOffset: Coor): Coor[] {
        return this.shape.map((currPos) => {
            const [x, y] = currPos;
            const [xoff, yoff] = posOffset;
            const coor: Coor = [x + xoff, y + yoff];
            return coor;
        });
    }
    private tryMove(direction: Coor): boolean {
        const newShape = this.translate(direction);
        console.log(`${this.shape} -> ${newShape}`)
        for (let coor of newShape) {
            const newCell = new Cell(coor);
            const inCurrShape = this.shape.find((c) => c[0] == coor[0] && c[1] == coor[1]);
            if (newCell.isOccupied() && !inCurrShape) {
                console.log(coor);
                return false;
            }
        }
        return true;
    }
    tryMoveLeft() {
        return this.tryMove([-1, 0]);
    }
    tryMoveDown() {
        return this.tryMove([0, 1]);
    }
    tryMoveRight() {
        return this.tryMove([1, 0]);
    }
    private move(posOffset: Coor): boolean {
        if (!this.tryMove(posOffset)) {
            return false;
        }

        this.destroy();
        this.shape = this.translate(posOffset);
        this.spawn();
        return true;
    }
    moveLeft() {
        return this.move([-1, 0]);
    }
    moveDown() {
        return this.move([0, 1]);
    }
    moveRight() {
        return this.move([1, 0]);
    }
    private rotate(direction: number): Coor[] {
        const [midpoint_sum_x, midpoint_sum_y] = this.shape.reduce((acc, coor) => [
            acc[0] + coor[0], 
            acc[1] + coor[1]
        ]);
        const [midpoint_x, midpoint_y] = [
            Math.floor(midpoint_sum_x / this.shape.length), 
            Math.floor(midpoint_sum_y / this.shape.length)
        ];
        return this.shape.map((currPos) => {
            const [x, y] = currPos;
            const coor: Coor = [
                midpoint_x - ((y - midpoint_y) * direction), 
                midpoint_y + ((x - midpoint_x) * direction)
            ];
            return coor;
        });
    }
    private tryRotate(direction: number) {
        const newShape = this.rotate(direction);
        for (let coor of newShape) {
            const newCell = new Cell(coor);
            const inCurrShape = this.shape.find((c) => c[0] == coor[0] && c[1] == coor[1]);
            if (newCell.isOccupied() && !inCurrShape) {
                console.log(coor);
                return false;
            }
        }
        return true;
    } 
    tryRotateLeft() {
        return this.tryRotate(1);
    }
    tryRotateRight() {
        return this.tryRotate(-1);
    }
    private turn(direction: number): boolean {
        if (!this.tryRotate(direction)) {
            return false;
        }
        console.log(this.shape);
        this.destroy();
        this.shape = this.rotate(direction);
        this.spawn();
        console.log(this.shape);
        return true;
    }
    rotateLeft(): boolean {
        return this.turn(1);
    }
    rotateRight(): boolean {
        return this.turn(-1);
    }
}

function updateScore(newScore) {
    score.innerHTML = newScore;
}

function incrementLevel() {
    let currLevel = parseInt(level.innerHTML);
    level.innerHTML = `${currLevel + 1}`;
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
    cell.setAttribute("status", "occupied");
    cell.style.left = x * cellWidth + "px";
    cell.style.top = y * cellWidth + "px";
    stage.appendChild(cell);
    return 0;
}

function initStage() {
    for (let x = 0; x < stageWidth; x++) {
        for (let y = 0; y < stageHeight; y++) {
            if (x == 0 || x == stageWidth - 1 || y == 0 || y == stageHeight - 1) {
                createBorderCell(x, y);
            } else {
                createCell(x, y);
            }
        }
    }
}

function spawnTetromino(t: Tetromino) { 
    t.moveDown(); 
}

function start() {
    console.log("Starting...");

    initStage();

    const J: Tetromino = new Tetromino("J");
    J.spawn([1, 1]);
    const T: Tetromino = new Tetromino("T");
    T.spawn([1, 10]);
    setInterval(() => spawnTetromino(J), 500);
}
window.addEventListener("load", start)

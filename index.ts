type HTMLElem = HTMLElement | null

const score: HTMLElem = document.querySelector(".score");
const level: HTMLElem = document.querySelector(".level");
const stage: HTMLElem = document.querySelector(".stage");
const gameOver: HTMLElem = document.querySelector(".game-over");

const cellWidth = 30;   // width/height in pixels
const stageWidth = 12;  // width in cells
const stageHeight = 22; // height in cells

type Coor = [number, number];

class Cell {
    readonly coor: Coor;
    readonly elem: HTMLElem;

    constructor(coor: Coor) {
        this.coor = coor;
        const [x, y] = coor;
        this.elem = document.querySelector(`[x='${x}'][y='${y}']`);
    }
    getCell(): HTMLElem {
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
    readonly cell: HTMLElem

    constructor(coor: Coor, color: string) {
        this.coor = coor;
        this.color = color;

        const cell: HTMLElem = new Cell(coor).getCell();
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
    trySpawn(origin: Coor) {
        const [offset_x, offset_y] = origin;
        const newShape = this.translate([offset_x - 1, offset_y - 1]);
        for (let coor of newShape) {
            const [x, y] = coor;
            const cell = new Cell([x, y]);
            if (cell.isOccupied()) {
                return false;
            }
        }
        return true;
    }
    spawn(origin: Coor = [1, 1]) {
        if (!this.trySpawn(origin)) {
            return false;
        }
        const [offset_x, offset_y] = origin;
        this.shape = this.translate([offset_x - 1, offset_y - 1]);
        for (let coor of this.shape) {
            const [x, y] = coor;
            const piece = new Piece([x, y], this.color);
            piece.spawn();
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
        for (let coor of newShape) {
            const newCell = new Cell(coor);
            const inCurrShape = this.shape.find((c) => c[0] == coor[0] && c[1] == coor[1]);
            if (newCell.isOccupied() && !inCurrShape) {
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
        // Using midpoint results in shape moving faster or slower on turn
        // const [midpoint_sum_x, midpoint_sum_y] = this.shape.reduce((acc, coor) => [
        //     acc[0] + coor[0], 
        //     acc[1] + coor[1]
        // ]);
        const [midpoint_x, midpoint_y] = this.shape[0];
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
        this.destroy();
        this.shape = this.rotate(direction);
        this.spawn();
        return true;
    }
    rotateLeft(): boolean {
        return this.turn(1);
    }
    rotateRight(): boolean {
        return this.turn(-1);
    }
}

class Game {
    score: number
    level: number
    activePiece: Tetromino
    interval: number 

    private tetrominoes = ["I", "J", "L", "O", "S", "T", "Z"];

    constructor() {
        this.score = 0;
        this.level = 1;
        this.activePiece = this.getTetromino();
        this.interval = 1000;

        for (let x = 0; x < stageWidth; x++) {
            for (let y = 0; y < stageHeight; y++) {
                const border: boolean = (x == 0 || x == stageWidth - 1 || y == 0 || y == stageHeight - 1);
                this.createCell([x, y], border);
            }
        }
    }

    updateScore(newScore: number) {
        if (score === null) {
            return;
        }
        score.innerHTML = newScore.toString();
        this.score = newScore;
    }

    incrementLevel() {
        if (level === null) {
            return;
        }
        let currLevel = parseInt(level.innerHTML);
        level.innerHTML = `${currLevel + 1}`;
        this.level += 1;
        clearInterval(this.interval);
        if (this.level % 10 == 0) {
            this.interval = setInterval(() => this.move(), this.interval - 20)
        }
    }

    createCell(coor: Coor, border: boolean = false) {
        const [x, y] = coor;
        const cell = document.createElement("div");
        cell.classList.add("cell");
        if (border) {
            cell.classList.add("border-cell");
            cell.setAttribute("status", "occupied");
        } else {
            cell.setAttribute("status", "free");
        }
        cell.setAttribute("x", x.toString());
        cell.setAttribute("y", y.toString());
        cell.style.left = x * cellWidth + "px";
        cell.style.top = y * cellWidth + "px";

        if (stage === null) {
            return;
        }

        stage.appendChild(cell);
        return 0;
    }

    getTetromino() {
        const randidx = Math.floor(Math.random() * this.tetrominoes.length)
        return new Tetromino(this.tetrominoes[randidx]);
    }

    move() {
        const status = this.activePiece.moveDown();
        if (!status) {
            this.activePiece = this.getTetromino();
            const canSpawn = this.activePiece.trySpawn([5, 1]);
            if (!canSpawn) {
                clearInterval(this.interval);
                window.removeEventListener("keydown", this.keypress);
                if (gameOver === null) {
                    return;
                }
                gameOver.style.display = "flex";
            }
            this.activePiece.spawn([5, 1]);
        }
    }

    keypress = (event) => {
        switch(event.key) {
            case "ArrowLeft":
                this.activePiece.moveLeft();
                break;
            case "ArrowRight":
                this.activePiece.moveRight();
                break;
            case "ArrowDown":
               this.activePiece.moveDown();
                break;
            case "ArrowUp":
                let status = true;
                do {
                    status = this.activePiece.moveDown();
                } while (status);
                break;
            case "z":
                this.activePiece.rotateLeft();
                break;
            case "x":
                this.activePiece.rotateRight();
                break;
        }
    }

    start() {
        this.activePiece.spawn([5, 1]);
        this.interval = setInterval(() => this.move(), this.interval);
        window.addEventListener("keydown", this.keypress);
    }
}

const game = new Game();
window.addEventListener("load", () => game.start());

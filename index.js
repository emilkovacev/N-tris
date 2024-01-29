const score = document.querySelector(".score");
const level = document.querySelector(".level");
const stage = document.querySelector(".stage");
const linesClearedDisplay = document.querySelector(".lines-cleared");
const gameOver = document.querySelector(".game-over");
const cellWidth = 30; // width/height in pixels
const stageWidth = 12; // width in cells
const stageHeight = 22; // height in cells
class Cell {
    constructor(coor) {
        this.coor = coor;
        const [x, y] = coor;
        this.elem = document.querySelector(`[x='${x}'][y='${y}']`);
    }
    getCell() {
        return this.elem;
    }
    isOccupied() {
        if (this.elem == null) {
            return false;
        }
        return this.elem.getAttribute("status") == "occupied";
    }
    isActive() {
        if (this.elem == null) {
            return false;
        }
        return this.elem.getAttribute("active") == "true";
    }
}
class Piece {
    constructor(coor, color = "", status = "occupied") {
        this.coor = coor;
        const cell = new Cell(coor).getCell();
        this.cell = cell;
        if (color === "" && cell != null) {
            this.color = cell.style.backgroundColor;
        }
        else {
            this.color = color;
        }
        if (cell != null && status != "occupied") {
            this.status = cell.getAttribute("status") || "";
        }
        else {
            this.status = status;
        }
    }
    spawn() {
        const cell = this.cell;
        if (cell == null) {
            return false;
        }
        cell.classList.add("square");
        cell.setAttribute("status", this.status);
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
    moveDown() {
        this.destroy();
        this.coor = [this.coor[0], this.coor[1] + 1];
        this.cell = new Cell(this.coor).getCell();
        this.spawn();
    }
}
class Tetromino {
    get(letter) {
        return this.tetrominoes[letter];
    }
    constructor(letter) {
        this.tetrominoes = {
            F: { shape: [[2, 1], [3, 1], [1, 2], [2, 2], [2, 3]], color: "wheat" },
            I: { shape: [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5]], color: "salmon" },
            L: { shape: [[1, 1], [1, 2], [1, 3], [1, 4], [2, 4]], color: "beige" },
            N: { shape: [[2, 1], [2, 2], [2, 3], [1, 3], [1, 4]], color: "lightgreen" },
            P: { shape: [[1, 1], [2, 1], [1, 2], [2, 2], [2, 3]], color: "darkgreen" },
            T: { shape: [[1, 1], [2, 1], [3, 1], [2, 2], [2, 3]], color: "green" },
            U: { shape: [[1, 1], [3, 1], [1, 2], [2, 2], [3, 2]], color: "turquoise" },
            V: { shape: [[3, 1], [3, 2], [1, 3], [2, 3], [3, 3]], color: "blue" },
            W: { shape: [[3, 1], [3, 2], [1, 3], [2, 3], [2, 2]], color: "rebeccapurple" },
            X: { shape: [[2, 1], [1, 2], [2, 2], [3, 2], [2, 3]], color: "purple" },
            Y: { shape: [[1, 1], [1, 2], [2, 2], [1, 3], [1, 4]], color: "plum" },
            Z: { shape: [[1, 1], [2, 1], [2, 2], [2, 3], [3, 3]], color: "pink" }
        };
        this.letter = letter;
        const { shape, color } = this.get(letter);
        this.shape = shape;
        this.color = color;
        console.log(letter, color);
    }
    trySpawn(origin) {
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
    spawn(origin = [1, 1]) {
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
    forceSpawn(origin = [1, 1]) {
        const [offset_x, offset_y] = origin;
        this.shape = this.translate([offset_x - 1, offset_y - 1]);
        for (let coor of this.shape) {
            const [x, y] = coor;
            const piece = new Piece([x, y], this.color);
            piece.spawn();
        }
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
    translate(posOffset) {
        return this.shape.map((currPos) => {
            const [x, y] = currPos;
            const [xoff, yoff] = posOffset;
            const coor = [x + xoff, y + yoff];
            return coor;
        });
    }
    tryMove(direction) {
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
    move(posOffset) {
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
    rotate(direction) {
        // Using midpoint results in shape moving faster or slower on turn
        const [midpoint_sum_x, midpoint_sum_y] = this.shape.reduce((acc, coor) => [
            acc[0] + coor[0],
            acc[1] + coor[1]
        ]);
        const [midpoint_x, midpoint_y] = [
            Math.round(midpoint_sum_x / this.shape.length),
            Math.round(midpoint_sum_y / this.shape.length)
        ];
        return this.shape.map((currPos) => {
            const [x, y] = currPos;
            const coor = [
                midpoint_x - ((y - midpoint_y) * direction),
                midpoint_y + ((x - midpoint_x) * direction)
            ];
            return coor;
        });
    }
    tryRotate(direction) {
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
    turn(direction) {
        if (!this.tryRotate(direction)) {
            return false;
        }
        this.destroy();
        this.shape = this.rotate(direction);
        this.spawn();
        return true;
    }
    rotateLeft() {
        return this.turn(1);
    }
    rotateRight() {
        return this.turn(-1);
    }
}
class Game {
    constructor() {
        this.tetrominoes = Object.keys(new Tetromino("I").tetrominoes);
        this.move = () => {
            const status = this.activePiece.moveDown();
            // Piece placed
            if (!status) {
                const linesCleared = this.clearLines();
                this.updateScore(linesCleared);
                if (this.totalLinesCleared >= this.level * 10) {
                    this.incrementLevel();
                }
                this.activePiece = this.getTetromino();
                const canSpawn = this.activePiece.spawn([5, 1]);
                // Game Over
                if (!canSpawn) {
                    // this.activePiece.forceSpawn([5, -1]);
                    clearInterval(this.interval);
                    window.removeEventListener("keydown", this.keypress);
                    if (gameOver === null) {
                        return;
                    }
                    gameOver.style.display = "flex";
                }
            }
        };
        this.keypress = (event) => {
            switch (event.key) {
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
                case "x":
                    this.activePiece.rotateLeft();
                    break;
                case "z":
                    this.activePiece.rotateRight();
                    break;
            }
        };
        this.score = 0;
        this.level = 1;
        this.activePiece = this.getTetromino();
        this.intervalTime = 1200;
        this.totalLinesCleared = 0;
        for (let x = 0; x < stageWidth; x++) {
            for (let y = 0; y < stageHeight; y++) {
                const border = (x == 0 || y == 0 || x == stageWidth - 1 || y == stageHeight - 1);
                this.createCell([x, y], border);
            }
        }
    }
    updateScore(linesCleared) {
        let updatedScore = this.score;
        switch (linesCleared) {
            case 1:
                updatedScore += 40 * (this.level + 1);
                break;
            case 2:
                updatedScore += 100 * (this.level + 1);
                break;
            case 3:
                updatedScore += 300 * (this.level + 1);
                break;
            case 4:
                updatedScore += 1200 * (this.level + 1);
                break;
        }
        if (score === null) {
            return;
        }
        score.innerHTML = updatedScore.toString();
        this.score = updatedScore;
    }
    incrementLevel() {
        if (level === null) {
            return;
        }
        this.level++;
        level.innerHTML = `${this.level}`;
        clearInterval(this.interval);
        this.intervalTime /= 2;
        this.interval = setInterval(this.move, this.intervalTime);
    }
    incrementlinesCleared() {
        if (linesClearedDisplay === null) {
            return;
        }
        this.totalLinesCleared++;
        linesClearedDisplay.innerHTML = `${this.totalLinesCleared}`;
    }
    createCell(coor, border = false) {
        const [x, y] = coor;
        const cell = document.createElement("div");
        cell.classList.add("cell");
        if (border) {
            cell.classList.add("border-cell");
            cell.setAttribute("status", "occupied");
        }
        else {
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
        const randidx = Math.floor(Math.random() * this.tetrominoes.length);
        return new Tetromino(this.tetrominoes[randidx]);
    }
    clearLine(y) {
        for (let x = 1; x < stageWidth - 1; x++) {
            const piece = new Piece([x, y]);
            piece.destroy();
        }
        for (let row = y - 1; row >= 1; row--) {
            for (let x = 1; x < stageWidth - 1; x++) {
                const piece = new Piece([x, row], "", "n/a");
                piece.moveDown();
            }
        }
        this.incrementlinesCleared();
    }
    clearLines() {
        let rowsCleared = 0;
        for (let row = stageHeight - 2; row >= 1;) {
            let numOccupied = 0;
            for (let x = 1; x < stageWidth - 1; x++) {
                let cell = new Cell([x, row]);
                if (cell.isOccupied()) {
                    numOccupied++;
                }
            }
            if (numOccupied == stageWidth - 2) {
                this.clearLine(row);
                rowsCleared++;
            }
            else {
                row--;
            }
        }
        return rowsCleared;
    }
    start() {
        this.activePiece.spawn([5, 1]);
        this.interval = setInterval(this.move, this.intervalTime);
        window.addEventListener("keydown", this.keypress);
    }
}
const game = new Game();
window.addEventListener("load", () => game.start());

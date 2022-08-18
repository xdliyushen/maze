import flattenDeep from "lodash/flattenDeep";
import random from "lodash/random";
import intersection from 'lodash/intersection';
import xor from 'lodash/xor';
import shuffle from 'lodash/shuffle';
import cloneDeep from 'lodash/cloneDeep';
import './styles.css';
// todo 构建表单
// todo 动画速率

const getRandomUnvisitedCell = (cells = [], exceptions = []) => {
    const unvisitedCells = xor(cells, exceptions);

    if (!unvisitedCells.length) {
        return null;
    }

    const cellIndex = random(0, unvisitedCells.length - 1);
    const randomCell = unvisitedCells[cellIndex];

    return randomCell;
}

class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.currentStep = 0;

        this.cells = [];

        this.steps = [];

        this._createCells();
        this._generateSteps();

        this.paintStep(0);
    }

    _createCells() {
        for (let i = 0; i < this.height; i++) {
            const row = [];

            for (let j = 0; j < this.width; j++) {
                const cell = new Cell(j, i, this);
                row.push(cell);
            }

            this.cells.push(row);
        }
    }

    _generateSteps() {
        const cells = flattenDeep(this.cells);

        const maze = [getRandomUnvisitedCell(cells)];

        while (maze.length < cells.length) {
            let path = [getRandomUnvisitedCell(cells, maze)];
            // 二维数组 存储 path 中已经做出的选择以及不能用的选择
            let currCell = path[0];
            let blackList = [];

            this.steps.push(
                this._snapshot(maze.concat(path), currCell),
            );

            while (1) {
                const deadEndCells = blackList[blackList.length - 1] || [];
                const currCellNeighbors = shuffle(currCell.getNeighbors()
                    // 不能往回走
                    .filter(v => path.indexOf(v) === -1 && deadEndCells.indexOf(v) === -1));
                // 是否与迷宫联通
                const isPathComplete = !!(intersection(currCellNeighbors, maze).length);

                if (isPathComplete) {
                    const inters = intersection(currCellNeighbors, maze);
                    const neighbor = inters[random(0, inters.length - 1)];

                    const direction = this._getDirection(currCell, neighbor);
                    currCell.connections[direction] = true;
                    const direction2 = this._getDirection(neighbor, currCell);
                    neighbor.connections[direction2] = true;

                    maze.push(...path);
                    path = [getRandomUnvisitedCell(cells, maze)];
                    currCell = path[0];
                    blackList = [];
                    break;
                } else {
                    let isAllLoop = true;
                    for (const nextCell of currCellNeighbors) {
                        const nextCellNeighbors = nextCell.getNeighbors();

                        // 是否在当前路径形成环形
                        const isLoop = !(intersection(nextCellNeighbors, path).length);

                        if (isLoop) {
                            continue;
                        } else {
                            const direction = this._getDirection(currCell, nextCell);
                            currCell.connections[direction] = true;
                            const direction2 = this._getDirection(nextCell, currCell);
                            nextCell.connections[direction2] = true;

                            isAllLoop = false;
                            path.push(nextCell);
                            blackList.push([nextCell]);
                            currCell = nextCell;
                            break;
                        }
                    }

                    if (isAllLoop) {
                        if (path.length === 1) {
                            const randomCell = getRandomUnvisitedCell(cells, maze);
                            path = [randomCell];
                            blackList = [[]];
                            currCell = randomCell;
                        } else {
                            path.pop();
                            const lastPath = path[path.length - 1];

                            const direction = this._getDirection(lastPath, currCell);
                            lastPath.connections[direction] = false;
                            const direction2 = this._getDirection(currCell, lastPath);
                            currCell.connections[direction2] = false;

                            blackList.pop();
                            blackList[blackList.length - 1].push(currCell);
                            currCell = path[path.length - 1];
                        }
                    }

                    this.steps.push(
                        this._snapshot(maze.concat(path), currCell),
                    );
                }
            }
        }

        this.steps.push(
            this._snapshot(maze),
        );
    }

    _getDirection(cell, neighbor) {
        if (cell.position.x === neighbor.position.x) {
            return cell.position.y > neighbor.position.y ? 'top' : 'bottom';
        }

        return cell.position.x > neighbor.position.x ? 'left' : 'right';
    }

    _snapshot(maze, currCell = null) {
        const cellsClone = cloneDeep(this.cells.map(row => {
            return row.map(v => {
                return {
                    position: v.position,
                    connections: v.connections,
                };
            });
        }));
        const mazeClone = maze.map(cell => {
            const { x, y } = cell.position;
            return cellsClone[y][x]
        });
        return {
            gridCells: cellsClone,
            maze: mazeClone,
            currCell: currCell ? cellsClone[currCell.position.y][currCell.position.x] : null,
        }
    }

    setCurrentStep(step) {
        this.currentStep = step;
    }

    paintStep(step) {
        const context = this.steps[step];

        if (!context) {
            return;
        }

        const { gridCells, maze, currCell } = context;
        const mazeEl = document.querySelector('#maze');
        mazeEl.innerHTML = '';

        for (const row of gridCells) {
            const rowEl = document.createElement('div');
            rowEl.className = 'row';

            for (const cell of row) {
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.style.borderColor = `${cell.connections.top ? 'transparent' : '#fff'} ${cell.connections.right ? 'transparent' : '#fff'} ${cell.connections.bottom ? 'transparent' : '#fff'} ${cell.connections.left ? 'transparent' : '#fff'}`;

                if (maze.indexOf(cell) > -1) {
                    cellEl.style.background = 'transparent';
                    cellEl.style.borderColor = `${cell.connections.top ? 'transparent' : '#000'} ${cell.connections.right ? 'transparent' : '#000'} ${cell.connections.bottom ? 'transparent' : '#000'} ${cell.connections.left ? 'transparent' : '#000'}`;
                }

                if (cell === currCell) {
                    cellEl.style.background = 'red';
                }

                rowEl.appendChild(cellEl);
            }

            mazeEl.appendChild(rowEl);
        }
    }

    getCell(x, y) {
        if (x < 0 || y < 0 || x === this.width || y === this.height) {
            return null;
        }

        return this.cells[y][x];
    }
}

class Cell {
    constructor(x, y, grid) {
        this.grid = grid;
        this.position = { x, y };
        this.connections = {
            top: false,
            bottom: false,
            left: false,
            right: false,
        };
    }

    getNeighbors() {
        if (!this.neighbors) {
            const { x, y } = this.position;
            this.neighbors = [
                // top
                this.grid.getCell(x, y - 1),
                // right
                this.grid.getCell(x + 1, y),
                // bottom
                this.grid.getCell(x - 1, y),
                // left
                this.grid.getCell(x, y + 1),
            ].filter(v => !!v);
        }

        return this.neighbors;
    }

    getRandomNeighbors(exceptions) {
        const neighbors = this.getNeighbors();
        const filteredNeighbors = neighbors.filter(v => {
            return !v && exceptions.indexOf(v) === -1;
        });
        const len = !filteredNeighbors.length;

        return len ? null : filteredNeighbors[random(0, len - 1)];
    }
}

let width = 5;
let height = 5;

let grid = new Grid(width, height);

const rangeInputEl = document.querySelector('#current-step input');
rangeInputEl.setAttribute('max', grid.steps.length - 1);
rangeInputEl.addEventListener('change', (e) => {
    const step = parseFloat(e.target.value);

    grid.setCurrentStep(step);
    grid.paintStep(step);
});

const widthInputEl = document.querySelector('#size input[name="width"]');
widthInputEl.value = width;
widthInputEl.addEventListener('change', e => {
    width = parseFloat(e.target.value);
    grid = new Grid(width, height);
    rangeInputEl.setAttribute('max', grid.steps.length - 1);
});

const heightInputEl = document.querySelector('#size input[name="height"]');
heightInputEl.value = height;
heightInputEl.addEventListener('change', e => {
    height = parseFloat(e.target.value);
    grid = new Grid(width, height);
    rangeInputEl.setAttribute('max', grid.steps.length - 1);
});

document.querySelector('#prev-step-button').addEventListener('click', () => {
    const targetStep = Math.max(grid.currentStep - 1, 0);

    grid.setCurrentStep(targetStep);
    grid.paintStep(targetStep);

    rangeInputEl.value = targetStep;
});

document.querySelector('#next-step-button').addEventListener('click', () => {
    const targetStep = Math.min(grid.currentStep + 1, grid.steps.length - 1);

    grid.setCurrentStep(targetStep);
    grid.paintStep(targetStep);

    rangeInputEl.value = targetStep;
});

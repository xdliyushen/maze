import flattenDeep from "lodash/flattenDeep";
import random from "lodash/random";
import intersection from 'lodash/intersection';
import xor from 'lodash/xor';
import shuffle from 'lodash/shuffle';
import './styles.css';
// todo 构建表单
// todo 时间旅行
// todo 动画速率

class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = [];

        for (let i = 0; i < height; i++) {
            const row = [];

            for (let j = 0; j < width; j++) {
                const cell = new Cell(j, i, this);
                row.push(cell);
            }

            this.cells.push(row);
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

const WIDTH = 15;
const HEIGHT = 15;

// 绘制
const paint = (grid) => {
    const app = document.querySelector('#app');
    app.innerHTML = '';

    for(const row of grid.cells) {
        const rowEl = document.createElement('div');
        rowEl.className = 'row';

        for(const cell of row) {
            const cellEl = document.createElement('div');
            cellEl.className = 'cell';
            cellEl.style.borderColor = `${cell.connections.top ? 'transparent' : '#000'} ${cell.connections.right ? 'transparent' : '#000'} ${cell.connections.bottom ? 'transparent' : '#000'} ${cell.connections.left ? 'transparent' : '#000'}`;            rowEl.appendChild(cellEl);
        }

        app.appendChild(rowEl);
    }
}

const main = () => {
    const grid = new Grid(WIDTH, HEIGHT);
    const cells = flattenDeep(grid.cells);

    const getRandomUnvisitedCell = (exceptions = []) => {
        const unvisitedCells = xor(cells, exceptions);

        if (!unvisitedCells.length) {
            return null;
        }

        const cellIndex = random(0, unvisitedCells.length - 1);
        const randomCell = unvisitedCells[cellIndex];

        return randomCell;
    }

    const getDirection = (cell, neighbor) => {
        if (cell.position.x === neighbor.position.x) {
            return cell.position.y > neighbor.position.y ? 'top' : 'bottom';
        }

        return cell.position.x > neighbor.position.x ? 'left' : 'right';
    }

    const maze = [getRandomUnvisitedCell()];

    while (maze.length < cells.length) {
        const pathStartCell = getRandomUnvisitedCell(maze);
        let path = [pathStartCell];
        // 二维数组 存储 path 中已经做出的选择以及不能用的选择
        let blackList = [];
        let currCell = pathStartCell;

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
                const direction = getDirection(currCell, neighbor);
                currCell.connections[direction] = true;
                const direction2 = getDirection(neighbor, currCell);
                neighbor.connections[direction2] = true;
                // 重新开始寻找新路径
                break;
            }

            let isAllLoop = true;
            for (const nextCell of currCellNeighbors) {
                const nextCellNeighbors = nextCell.getNeighbors();

                // 是否在当前路径形成环形
                const isLoop = !(intersection(nextCellNeighbors, path).length);

                if (isLoop) {
                    continue;
                } else {
                    const direction = getDirection(currCell, nextCell);
                    currCell.connections[direction] = true;
                    const direction2 = getDirection(nextCell, currCell);
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
                    const randomCell = getRandomUnvisitedCell(maze);
                    path = [randomCell];
                    blackList = [[]];
                    currCell = randomCell;
                } else {
                    const lastPath = path.pop();

                    const direction = getDirection(lastPath, currCell);
                    lastPath.connections[direction] = false;
                    const direction2 = getDirection(currCell,lastPath);
                    currCell.connections[direction2] = false;

                    blackList.pop();
                    blackList[blackList.length - 1].push(currCell);
                    currCell = path[path.length - 1];
                }
            }
        }

        maze.push(...path);
    };

    paint(grid);
};

main();
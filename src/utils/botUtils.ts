import { createEmptyBoard } from "../db";
import type { GameBoard, Ship } from "../types";

const SHIP_CONFIG = [
	{ type: 'huge', length: 4, count: 1 },
	{ type: 'large', length: 3, count: 2 },
	{ type: 'medium', length: 2, count: 3 },
	{ type: 'small', length: 1, count: 4 }
] as const;

const canPlaceShip = (board: number[][], x: number, y: number, length: number, direction: boolean): boolean => {
	for (let i = 0; i < length; i++) {
		const newX = direction ? x : x + 1;
		const newY = direction ? y + 1 : y;

		if (newX >= 10 || newY >= 10) return false;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const cx = newX + dx;
				const cy = newY + dy;
				if (cx >= 0 && cx < 10 && cy >= 0 && cy < 10) {
					if (board[cy][cx] === 1) {
						return false;
					}
				}
			}
		}
	}
	return true;
};

const placeShip = (board: number[][], ship: Ship) => {
	for (let i = 0; i < ship.length; i++) {
		const x = ship.direction ? ship.position.x : ship.position.x + i;
		const y = ship.direction ? ship.position.y + i : ship.position.y;
		board[y][x] = 1;
	}
};

export const generateRandomBotShips = (): Ship[] => {
	const botShips: Ship[] = [];
	const botBoard: number[][] = createEmptyBoard();

	for (const config of SHIP_CONFIG) {
		for (let i = 0; i < config.count; i++) {
			let placed = false;
			while (!placed) {
				const direction = Math.random() > 0.5;
				const x = Math.floor(Math.random() * 10);
				const y = Math.floor(Math.random() * 10);
				if (canPlaceShip(botBoard, x, y, config.length, direction)) {
					const ship: Ship = {
						position: { x, y },
						direction,
						length: config.length,
						type: config.type,
					};
					botShips.push(ship);
					placeShip(botBoard, ship);
					placed = true;
				}
			}
		}
	}
	return botShips;
};

export const makeBotAttack = (playerBoard: GameBoard): [number, number] => {
	const availableCells: [number, number][] = [];

	// May be make some smart way algo
	for (let y = 0; y < 10; y++) {
		for (let x = 0; x < 10; x++) {
			if (playerBoard[y][x] === 0 || playerBoard[y][x] === 1) {
				availableCells.push([x, y]);
			}
		}
	}

	if (availableCells.length === 0) return [0, 0];
	
	const randomIndex = Math.floor(Math.random() * availableCells.length);
	return availableCells[randomIndex];
}

import type { WebSocketServer } from "ws";
import { broadcastWinners, sendResponse } from "../broadcaster";
import {
	getRoomById,
	setPlayerShips,
	areBothPlayerReady,
	switchTurn,
	updateWinner,
	// findUserByIndex
} from "../../db/index";
import type {
	WebSocketContexted,
	AddShipsPayload,
	Room,
	RoomUser,
	AttackPayload,
	AttackStatus,
	GameBoard,
	Ship
} from "../../types/index";
import { BOT_USER_INDEX, BOT_NAME } from "../../types/index";
import { makeBotAttack } from "../../utils/botUtils";

const sendToRoom = (room: Room, type: string, data: unknown) => {
	const message = JSON.stringify({ type, data: JSON.stringify(data), id: 0 });
	room.roomUsers.forEach((user: RoomUser) => {
		if (user.ws && user.ws.readyState === user.ws.OPEN) {
			user.ws.send(message);
		}
	});
};

const findShipAt = (ships: Ship[], x: number, y: number): Ship | undefined => {
	return ships.find((ship) => {
		for (let i = 0; i < ship.length; i++) {
			const shipX = ship.direction ? ship.position.x : ship.position.x + i;
			const shipY = ship.direction ? ship.position.y + i : ship.position.y;
			if (shipX === x && shipY === y) {
				return true;
			}
		}
		return false;
	});
};

const isKilled = (board: GameBoard, ships: Ship[], x: number, y: number): boolean => {
	const hitShip = findShipAt(ships, x, y);
	if (!hitShip) return false;
	for (let i = 0; i < hitShip.length; i++) {
		const shipX = hitShip.direction ? hitShip.position.x : hitShip.position.x + i;
		const shipY = hitShip.direction ? hitShip.position.y + i : hitShip.position.y;
		if (board[shipY][shipX] !== 3) {
			return false;
		}
	}
	return true;
};

const surroundingCells = [
	{ dx: -1, dy: -1 },
	{ dx: 0, dy: -1 },
	{ dx: 1, dy: -1 },
	{ dx: -1, dy: 0 },
	{ dx: 1, dy: 0 },
	{ dx: -1, dy: 1 },
	{ dx: 0, dy: 1 },
	{ dx: 1, dy: 1 },
];

const fillMissAround = (board: GameBoard, ships: Ship[], x: number, y: number)
	: Array<{ x: number; y: number }> => {
	const hitShip = findShipAt(ships, x, y);
	if (!hitShip) return [];
	const missCells: Array<{ x: number; y: number }> = [];
	const addedCells = new Set<string>();
	for (let i = 0; i < hitShip.length; i++) {
		const shipX = hitShip.direction ? hitShip.position.x : hitShip.position.x + i;
		const shipY = hitShip.direction ? hitShip.position.y + i : hitShip.position.y;

		for (const cell of surroundingCells) {
			const checkX = shipX + cell.dx;
			const checkY = shipY + cell.dy;
			const cellKey = `${checkX}:${checkY}`;
			if (
				checkX >= 0 &&
				checkX < 10 &&
				checkY >= 0 &&
				checkY < 10 &&
				board[checkY][checkX] === 0 &&
				!addedCells.has(cellKey)
			) {
				board[checkY][checkX] = 2;
				missCells.push({ x: checkX, y: checkY });
				addedCells.add(cellKey);
			}
		}
	}
	return missCells;
};

const checkWinner = (opponentBoard: GameBoard): boolean => {
	for (let y = 0; y < 10; y++) {
		for (let x = 0; x < 10; x++) {
			if (opponentBoard[y][x] === 1) return false;
		}
	}
	return true;
};

export const handleAttack = (wss: WebSocketServer, ws: WebSocketContexted, data: string) => {
	try {
		const { gameId, x, y, indexPlayer } = JSON.parse(data) as AttackPayload;
		
		if (ws.userIndex !== indexPlayer) throw new Error('Player index mismatch');
		
		const room = getRoomById(String(gameId));
		if (!room || !room.gameBoards || !room.ships) throw new Error('Game not found or not initialized');

		if (room.currentPlayerIndex !== indexPlayer) {
			console.warn(`Player ${indexPlayer} try to attacked out of turn.`);
			return;
		}
		const opponentRoomIndex = room.roomUsers.findIndex(u => u.index !== indexPlayer);
		if (opponentRoomIndex === -1) throw new Error('Opponent not found');
		
		const opponentBoard = room.gameBoards[opponentRoomIndex];
		const opponentShips = room.ships![opponentRoomIndex];

		const cellState = opponentBoard[y][x];
		let status: AttackStatus = 'miss';
		let isTurnSwitch = true;

		if (cellState === 0) {
			opponentBoard[y][x] = 2;
			status = "miss";
			isTurnSwitch = true;
		} else if (cellState === 1) {
			opponentBoard[y][x] = 3;
			isTurnSwitch = false;
			status = isKilled(opponentBoard, opponentShips, x, y) ? 'killed' : 'shot';
			if (status === 'killed') {
				const missCells = fillMissAround(opponentBoard, opponentShips, x, y);
				for (const miss of missCells) {
					sendToRoom(room, 'attack', {
						position: miss,
						currentPlayer: indexPlayer,
						status: 'miss',
					});
				}
			}
			if (checkWinner(opponentBoard)) {
				console.log(`Player ${indexPlayer} won game ${gameId}`);
				sendToRoom(room, 'finish', { winPlayer: indexPlayer });
				const winnerUser = room.roomUsers.find(u => u.index === indexPlayer);
				if (winnerUser) {
					updateWinner(winnerUser.name);
				}
				broadcastWinners(wss);
				return ;
			}
		}
		sendToRoom(room, 'attack', {
			position: {x, y},
			currentPlayer: indexPlayer,
			status: status,
		});

		let nextPlayer = indexPlayer;
		if (isTurnSwitch) {
			nextPlayer = switchTurn(room);
		}
		sendToRoom(room, 'turn', { currentPlayer: nextPlayer });
		if (nextPlayer === BOT_USER_INDEX) {
			setTimeout(() => {
				triggerBotAttack(wss, room);
			}, 500);
		}

	} catch (error) {
		console.error('Attack error:', error);
		sendResponse(ws, 'error', { 
		error: true, 
		errorText: (error as Error).message || 'Failed to attack' 
		});
	}
};

export const handleAddShips = (wss: WebSocketServer, ws: WebSocketContexted, data: string) => {

	try {
		const { gameId, ships, indexPlayer } = JSON.parse(data) as AddShipsPayload;
		if (ws.userIndex !== indexPlayer) {
			throw new Error('Player index mismatch');
		}
		const room = setPlayerShips(gameId, indexPlayer, ships);
		if (!room) {
			throw new Error('Room not found or game not initialized');
		}
		console.log(`Player ${indexPlayer} in room ${gameId} added ${ships.length} ships.`);
		if (areBothPlayerReady(room)) {
			console.log(`Game ${gameId} is starting now!`);
			room.roomUsers.forEach((user, index) => {
				if (user.ws) {
					sendResponse(user.ws, 'start_game', {
						ships: room.ships![index],
						currentPlayerIndex: user.index,
					});
				}
			});
			
			sendToRoom(room, 'turn', {
				currentPlayer: room.currentPlayerIndex,
			});
		}
	} catch (error) {
		console.error('AddShips error: ', error);
		sendResponse(ws, 'error', {
			error: true,
			errorText: (error as Error).message || 'Failed to add ships'
		});
	}
};

const triggerBotAttack = (wss: WebSocketServer, room: Room) => {
	let botTurn = true;
	do {
		const playerRoomUser = room.roomUsers.find(u => u.index !== BOT_USER_INDEX);
		if (!playerRoomUser) return;
		
		const playerRoomIndex = room.roomUsers.findIndex(u => u.index === playerRoomUser.index);
		const playerBoard = room.gameBoards![playerRoomIndex];
		const playerShips = room.ships![playerRoomIndex];

		const [x, y] = makeBotAttack(playerBoard);

		const cellState = playerBoard[y][x];
		let status: AttackStatus = 'miss';
		let isTurnSwitch = true;
		let sendPrimaryAttack = true;

		if (cellState === 0) {
			playerBoard[y][x] = 2;
			status = 'miss';
			isTurnSwitch = true;
		} else if (cellState === 1) {
			playerBoard[y][x] = 3;
			status = 'shot';
			isTurnSwitch = false;

			if (isKilled(playerBoard, playerShips, x, y)) {
				status = 'killed';
				
				sendToRoom(room, 'attack', {
					position: { x, y },
					currentPlayer: BOT_USER_INDEX,
					status: 'killed',
				});

				const missCells = fillMissAround(playerBoard, playerShips, x, y);
				missCells.forEach(miss => {
					sendToRoom(room, 'attack', {
						position: miss,
						currentPlayer: BOT_USER_INDEX,
						status: 'miss',
					});
				});
				sendPrimaryAttack = false;
				if (checkWinner(playerBoard)) {
					console.log(`Bot won game ${room.roomId}`);
					sendToRoom(room, 'finish', { winPlayer: BOT_USER_INDEX });
					updateWinner(BOT_NAME);
					broadcastWinners(wss);
					return;
				}
			}
		} else if (cellState === 2 || cellState === 3) {
			status = 'miss';
			isTurnSwitch = true;
		}

		if (sendPrimaryAttack) {
			sendToRoom(room, 'attack', {
				position: { x, y },
				currentPlayer: BOT_USER_INDEX,
				status: status,
			});
		}
		if (isTurnSwitch) {
			switchTurn(room);
			botTurn = false;
		}		
		sendToRoom(room, 'turn', { currentPlayer: room.currentPlayerIndex });
	} while (botTurn);
};
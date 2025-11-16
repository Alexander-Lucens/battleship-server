import type { WebSocketServer } from "ws";
import { sendResponse } from "../broadcaster";
import {
	getRoomById,
	setPlayerShips,
	areBothPlayerReady,
	switchTurn
} from "../../db";
import type {
	WebSocketContexted,
	AddShipsPayload,
	Room,
	RoomUser,
	AttackPayload,
	AttackStatus,
	GameBoard,
	Ship
} from "src/types";

const sendToRoom = (room: Room, type: string, data: unknown) => {
	const message = JSON.stringify({ type, data: JSON.stringify(data), id: 0 });
	room.roomUsers.forEach((user: RoomUser) => {
		if (user.ws.readyState === user.ws.OPEN) {
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
		const shipX = hitShip.direction ? hitShip.position.x : hitShip.position.x + 1;
		const shipY = hitShip.direction ? hitShip.position.y + 1 : hitShip.position.y;
		if (board[shipY][shipX] !== 3) {
			return false;
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
		} else if (cellState === 2 || cellState === 3) {
			status = "miss";
			isTurnSwitch = true;
		}

		const  attackResponseData = {
			position: {x, y},
			currentPlayer: indexPlayer,
			status: status,
		};
		sendToRoom(room, 'attack', attackResponseData);

		let nextPlayer = indexPlayer;
		if (isTurnSwitch) {
			nextPlayer = switchTurn(room);
		}

		sendToRoom(room, 'turn', { currentPlayer: nextPlayer });
	
		// Should be allso 1. Is all ships `killed` -> finish
		// maybe send `miss` around `killed` ship
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
				sendResponse(user.ws, 'start_game', {
					ships: room.ships![index],
					currentPlayerIndex: user.index,
				});
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
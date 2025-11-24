import type {
	User,
	RoomUser,
	Room,
	ClientRoom,
	Winner,
	WebSocketContexted,
	GameBoard,
	Ship,
} from "../types/index";
import { hashPassword } from "../utils/encription";

/* USERS DB ************************************************************/

const usersDB = new Map<string, User>();
let newUserIndex = 0;

export const findUserByName = (name: string): User | undefined => {
	return usersDB.get(name);
}

export const createUser = (name: string, password: string): User => {
	const { salt, passwordHash } = hashPassword(password);

	const newUser: User = {
		name,
		passwordHash,
		salt,
		index: newUserIndex++,
	};

	usersDB.set(name, newUser);
	return newUser;
};

export const findUserByIndex = (index: number): User | undefined => {
	for (const user of usersDB.values()) {
		if (user.index === index) return user;
	}
	return undefined;
};

/* HELPERS (empty Board) ***********************************************/

export const createEmptyBoard = (): GameBoard => {
	return (Array(10).fill(null).map(() => Array(10).fill(0)));
};
/* ********************************************************************/


/* ROOM DB ************************************************************/

const roomsDB = new Map<string, Room>();
let nextRoomId = 0;

export const createRoom = (user: RoomUser): Room => {
	const roomId = (nextRoomId++).toString();
	const newRoom: Room = {
		roomId,
		roomUsers: [user],
	};
	roomsDB.set(roomId, newRoom);
	return newRoom;
};

export const getAvalibleRooms = (): ClientRoom[] => {
	const avalibleRooms: ClientRoom[] = [];
	for (const room of roomsDB.values()) {
		if (room.roomUsers.length === 1) {
			avalibleRooms.push({
				roomId: room.roomId,
				roomUsers: [{
					name: room.roomUsers[0].name,
					index: room.roomUsers[0].index,
				}],
			});
		}
	}
	return avalibleRooms;
};

export const getRoomById = (roomId: string): Room | undefined => {
	return roomsDB.get(roomId);
};

export const addUserToRoom = (roomId: string, user: RoomUser): Room | undefined => {
	const room = roomsDB.get(roomId);
	if (room && room.roomUsers.length < 2) {
		if (room.roomUsers[0].index === user.index) return undefined;
		
		room.roomUsers.push(user);

		if (room.roomUsers.length === 2) {
			room.gameBoards = [createEmptyBoard(), createEmptyBoard()];
			room.ships = [[], []];
			room.currentPlayerIndex = room.roomUsers[Math.floor(Math.random() * 2)].index;
		}

		return room;
	}
	return undefined;
};

export const setPlayerShips = (
	gameId: string | number,
	playerIndex: number,
	ships: Ship[]
) : Room | undefined => {
	const room = getRoomById(String(gameId));
	if (!room || !room.ships || !room.gameBoards) return undefined;
	const playerRoomIndex = room.roomUsers.findIndex(u => u.index === playerIndex);
	if (playerRoomIndex === -1) return undefined;
	room.ships[playerRoomIndex] = ships;

	const board = room.gameBoards[playerRoomIndex];
	ships.forEach(ship => {
		for (let i = 0; i < ship.length; i++) {
			const x = ship.direction ? ship.position.x : ship.position.x + i;
			const y = ship.direction ? ship.position.y + i : ship.position.y;
			if (x < 10 && y < 10) {
				board[y][x] = 1;
			}
		}
	});
	return room;
};

export const areBothPlayerReady = (room: Room): boolean => {
	return room.ships?.[0] != null && room.ships[0].length > 0 &&
			room.ships?.[1] != null && room.ships[1].length > 0;
}

/***************************************************** */

export const removeUserFromRooms = (ws: WebSocketContexted): Room | undefined => {
	let affectedRoom: Room | undefined = undefined;
	for (const room of roomsDB.values()) {
		const userIndex = room.roomUsers.findIndex(u => u.ws === ws);
		if (userIndex !== -1) {
			room.roomUsers.splice(userIndex, 1);
			affectedRoom = room;
			if (room.roomUsers.length === 0) {
				roomsDB.delete(room.roomId);
			}
			break;
		}
	}
	return affectedRoom;
};

/* WINNERS DB *********************************************************/

const winnresDB = new Map<string, number>();

export const getWinners = (): Winner[] => {
	const winners: Winner[] = [];
	for (const [name, wins] of winnresDB.entries()) {
		winners.push({ name, wins });
	}
	return winners.sort((a,b) => b.wins - a.wins);
};

export const updateWinner = (name: string) => {
	const currentWins = winnresDB.get(name) || 0;
	winnresDB.set(name, currentWins + 1);
};

/* SHITCH TURN *********************************************************/

export const switchTurn = (room: Room): number => {
	const pi1 = room.roomUsers[0].index;
	const pi2 = room.roomUsers[1].index;

	room.currentPlayerIndex = (room.currentPlayerIndex === pi1) ? pi2 : pi1;
	
	return room.currentPlayerIndex;
};
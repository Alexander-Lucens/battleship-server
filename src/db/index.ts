import type {
	User,
	RoomUser,
	Room,
	ClientRoom,
	Winner,
	WebSocketContexted
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
		room.roomUsers.push(user);
		return room;
	}
	return undefined;
};

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
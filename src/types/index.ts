import type { WebSocket } from "ws";

export interface User {
	name: string;
	passwordHash: string;
	salt: string;
	index: number;
}

export interface WebSocketContexted extends WebSocket {
	userIndex?: number;
}

export interface IncomingMessage {
	type: string;
	data: string;
	id: number;
}

export interface ResponseMessage {
	type: string;
	data: string;
	id: number;
}

export interface RoomUser {
	name: string;
	index: number;
	ws: WebSocketContexted;
}

export interface Room {
	roomId: string;
	roomUsers: RoomUser[];
	// Maybe there is nice place to store game state conditions
}

export interface ClientRoomUser {
	name: string;
	index: number;
}

export interface ClientRoom {
	roomId: string;
	roomUsers: ClientRoomUser[];
}

export interface Winner {
	name: string;
	wins: number;
}
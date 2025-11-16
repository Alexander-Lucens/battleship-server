import type { WebSocketServer } from "ws";
import type { WebSocketContexted} from "../../types/index";
// import { ResponseMessage } from "../../types/index";
import { findUserByIndex, createRoom, addUserToRoom } from "../../db/index";
import { broadcastAvalibleRooms, sendResponse } from "../broadcaster";


export const handleCreateRoom = (wss: WebSocketServer, ws: WebSocketContexted) => {
	if (typeof ws.userIndex !== 'number') {
		sendResponse(ws, 'error', { error: true, errorText: 'User is not registered' });
		return ;
	}

	const user = findUserByIndex(ws.userIndex);
	if (!user) {
		sendResponse(ws, 'error', { error: true, errorText: 'User not found' });
		return ;
	}

	createRoom({
		name: user.name,
		index: user.index,
		ws: ws,
	});
	broadcastAvalibleRooms(wss);
};

export const handleJoinRoom = (wss: WebSocketServer, ws: WebSocketContexted, data: string) => {
	if (typeof ws.userIndex !== "number") {
		sendResponse(ws, 'error', { error: true, errorText: 'User is not registered' });
		return ;
	}
	const user = findUserByIndex(ws.userIndex);
	if (!user) {
		sendResponse(ws, 'error', { error: true, errorText: 'User not found' });
		return ;
	}
	let roomId: string;
	try {
		const { indexRoom } = JSON.parse(data);
		if (typeof indexRoom === 'undefined') throw new Error('indexRoom required');
		roomId = String(indexRoom);

	} catch (error) {
		console.error('handleJoinRoom error: ', error);
		sendResponse(ws, 'error', { error: true, errorText: 'Invalid data format for add_user_to_room' });
		return;
	}

	const room = addUserToRoom(roomId, {
		name: user.name,
		index: user.index,
		ws: ws,
	});

	if (!room) {
		sendResponse(ws, 'error', { error: true, errorText: 'Room not found or is full' });
		return;
	}
	console.log(`Game created: ${room.roomId}. Players: ${room.roomUsers.map((u) => u.name).join(', ')}`);
	
	sendResponse(room.roomUsers[0].ws, 'create_game', {
		idGame: room.roomId,
		idPlayer: room.roomUsers[0].index,
	});

	sendResponse(room.roomUsers[1].ws, 'create_game', {
		idGame: room.roomId,
		idPlayer: room.roomUsers[1].index,
	});

	broadcastAvalibleRooms(wss);
};
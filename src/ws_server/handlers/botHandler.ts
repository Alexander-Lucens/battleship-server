// src/ws_server/handlers/botHandler.ts
import type { WebSocketServer } from 'ws';
import type { WebSocketContexted, RoomUser } from '../../types/index';
import { BOT_USER_INDEX, BOT_NAME } from '../../types/index';
import { findUserByIndex, createRoom, addUserToRoom, setPlayerShips } from '../../db/index';
import { sendResponse, broadcastAvalibleRooms } from '../broadcaster';
import { generateRandomBotShips } from '../../utils/botUtils';

export const handleSinglePlay = (wss: WebSocketServer, ws: WebSocketContexted) => {
	if (typeof ws.userIndex !== 'number') {
		sendResponse(ws, 'error', { error: true, errorText: 'User not registered' });
		return;
	}
	const player = findUserByIndex(ws.userIndex);
	if (!player) {
		sendResponse(ws, 'error', { error: true, errorText: 'User not found' });
		return;
	}

	const playerRoomUser: RoomUser = {
		name: player.name,
		index: player.index,
		ws: ws,
	};
	const room = createRoom(playerRoomUser);

	const botShips = generateRandomBotShips();

	const botRoomUser: RoomUser = {
		name: BOT_NAME,
		index: BOT_USER_INDEX,
		ws: null,
	};
	addUserToRoom(room.roomId, botRoomUser); 
	setPlayerShips(room.roomId, BOT_USER_INDEX, botShips);

	console.log(`Single play game ${room.roomId} created for ${player.name}`);
	sendResponse(ws, 'create_game', {
		idGame: room.roomId,
		idPlayer: player.index,
	});	
	broadcastAvalibleRooms(wss);
};
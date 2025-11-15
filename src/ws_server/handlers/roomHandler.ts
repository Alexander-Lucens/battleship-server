import { WebSocketServer } from "ws";
import { WebSocketContexted, ResponseMessage } from "../../types/index.js";
import { findUserByIndex, createRoom } from "../../db/index.js";
import { broadcastAvalibleRooms, sendResponse } from "../broadcaster.js";


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
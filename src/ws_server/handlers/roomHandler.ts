import type { WebSocketServer } from "ws";
import type { WebSocketContexted} from "../../types/index";
// import { ResponseMessage } from "../../types/index";
import { findUserByIndex, createRoom } from "../../db/index";
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
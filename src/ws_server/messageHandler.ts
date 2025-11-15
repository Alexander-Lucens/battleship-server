import type { WebSocketContexted, IncomingMessage } from "../types/index";
import type { WebSocketServer } from "ws";
import { handleRegistration } from "./handlers/regHandler";
import { handleCreateRoom } from "./handlers/roomHandler";


export const handleMessage = (wss: WebSocketServer, ws: WebSocketContexted, message: IncomingMessage) => {
	console.log(`Received command: ${message.type}`);

	switch (message.type) {
		case 'reg':
			handleRegistration(wss, ws, message.data);
			break;
		
		case 'create_room':
			handleCreateRoom(wss, ws);
			break;

		default:
			console.warn(`Unknown message type: ${message.type}`);
	}
}
import { WebSocketContexted, IncomingMessage } from "../types/index.js";
import { WebSocketServer } from "ws";
import { handleRegistration } from "./handlers/regHandler.js";
import { handleCreateRoom } from "./handlers/roomHandler.js";


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
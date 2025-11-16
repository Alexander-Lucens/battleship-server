import type { WebSocketContexted, IncomingMessage } from "../types/index";
import type { WebSocketServer } from "ws";
import { handleRegistration } from "./handlers/regHandler";
import { handleCreateRoom, handleJoinRoom } from "./handlers/roomHandler";
import { handleAddShips, handleAttack } from "./handlers/gameHandler";


export const handleMessage = (wss: WebSocketServer, ws: WebSocketContexted, message: IncomingMessage) => {
	console.log(`Received command: ${message.type}`);

	switch (message.type) {
		case 'reg':
			handleRegistration(wss, ws, message.data);
			break;
		
		case 'create_room':
			handleCreateRoom(wss, ws);
			break;

		case 'add_user_to_room':
			handleJoinRoom(wss, ws, message.data);
			break;
		
		case 'add_ships':
			handleAddShips(wss, ws, message.data);
			break;
		
		case 'attack':
			handleAttack(wss, ws, message.data);
			break;


		case 'single_play':
			console.log(`SINGLE PLAYER MODE IS NOT IMPLEMENTED!`);
			// handleSinglePlay(wss, ws, massage.data);
			break;

		default:
			console.warn(`Unknown message type: ${message.type}`);
	}
}
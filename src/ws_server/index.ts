import * as http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from '../types/index.js';


export const initWebSocketServer = (server: http.Server) => {
	const wss = new WebSocketServer({ server });

	wss.on('connection', (ws: WebSocket) => {
		console.log(`Client connected`);

		/**
		 * Player connection
		 */
		ws.on('message', (message: string) => {
			try {
				const parsedMessage: IncomingMessage = JSON.parse(message);
				// Before prod check
				console.log(`Recieved message type: ${parsedMessage.type}`);

				// Handle that sheat later in separate module
			} catch (err) {
				console.error(`Failed to parse message or invalid format of -> ${message}`);
			}
		});

		/**
		 * Palyer disconection.
		 */
		ws.on('close', () => {
			console.log(`Player disconected`);
			// Delete from room or put in pool of deleted,
			// but i think for buttleships game its not required.
			// may be just make a timer of 15 sec for re-conection 
		});

		/**
		 * WS Error catcking
		 */
		ws.on('error', (error: Error) => {
			console.error(`WebSocet error: ${error}`);
		});
	});

	console.log(`WebSocket server initialised.`);
	return wss;
}
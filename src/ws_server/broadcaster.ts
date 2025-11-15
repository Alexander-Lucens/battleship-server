import { WebSocketServer } from "ws";
import { WebSocketContexted, ResponseMessage } from "../types/index.js";
import { getAvalibleRooms, getWinners } from "../db/index.js";


export const sendResponse = (ws: WebSocketContexted, type: string, data: unknown) => {
	const response: ResponseMessage = {
		type,
		data: JSON.stringify(data),
		id: 0,
	};
	ws.send(JSON.stringify(response));
};
export const broadcast = (wss: WebSocketServer, type: string, data: unknown) => {
	const response: ResponseMessage = {
		type,
		data: JSON.stringify(data),
		id: 0,
	};
	const message = JSON.stringify(response);
	wss.clients.forEach((client) => {
		if (client.readyState === client.OPEN) {
			client.send(message);
		}
	});
};

export const broadcastAvalibleRooms = (wss: WebSocketServer) => {
	const rooms = getAvalibleRooms();
	broadcast(wss, 'update_room', rooms);
	console.log(`Broadcasted update_room to ${wss.clients.size} clients`);
};

export const broadcastWinners = (wss: WebSocketServer) => {
	const winners = getWinners();
	broadcast(wss, 'update_winners', winners);
	console.log(`Broadcasted update_winners`);
}

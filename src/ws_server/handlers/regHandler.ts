import type { WebSocketContexted} from "../../types/index";
// import { ResponseMessage } from "../../types/index";
import { findUserByName, createUser } from "../../db/index";
import { verifyPassword } from "../../utils/encription";
import type { WebSocketServer } from "ws";
import { sendResponse, broadcastAvalibleRooms, broadcastWinners } from "../broadcaster";

export const handleRegistration = (wss: WebSocketServer, ws: WebSocketContexted, data: string) => {
	let resData;
	let isSuccessfulRegister = false;
	try {
		const { name, password } = JSON.parse(data);
		if (!name || !password) throw new Error('name and password required');
		let user = findUserByName(name);
		if (user) {
			const isVerified = verifyPassword(password, user.passwordHash, user.salt);
			if (isVerified) {
				ws.userIndex = user.index;
				resData = {
					name: user.name,
					index: user.index,
					error: false,
					errorText: '',
				};
				isSuccessfulRegister = true;
			} else {
				resData = {
					name: name,
					index: -1,
					error: true,
					errorText: "Invalid user data"
				};
			}
		} else {
			user = createUser(name, password);
			ws.userIndex = user.index;
			resData = {
				name: user.name,
				index: user.index,
				error: false,
				errorText: '',
			};
			isSuccessfulRegister = true;
		}

		sendResponse(ws, 'reg', resData);
		if (isSuccessfulRegister) {
			broadcastAvalibleRooms(wss);
			broadcastWinners(wss);
		}
	} catch (error) {
		console.error(`Registration error: `, error);

		sendResponse(ws, 'reg', {
			name: '',
			index: -1,
			error: true,
			errorText: (error as Error).message || 'Invalid registration data',
		});
	}
};
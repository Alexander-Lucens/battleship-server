import { WebSocketContexted, ResponseMessage } from "../../types/index.js";
import { findUserByName, createUser } from "../../db/index.js";
import { verifyPassword } from "../../utils/encription.js";
import { errorMonitor } from "events";

export const handlerRegistration = (ws: WebSocketContexted, data: string) => {
	try {
		const { name, password } = JSON.parse(data);
		if (!name || !password) throw new Error('Name and password required');
		let user = findUserByName(name);
		let resData;

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
			} else {
				resData = {
					name,
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
		}

		const response: ResponseMessage = {
			type: 'reg',
			data: JSON.stringify(resData),
			id: 0,
		};
		ws.send(JSON.stringify(response));
	} catch (error) {
		console.error(`Registration error: `, error);

		const errorResponse: ResponseMessage = {
			type: 'reg',
			data: JSON.stringify({
				name: '',
				index: -1,
				error: true,
				errorText: (error as Error).message || 'Invalid registration data',
			}),
			id: 0,
		};
		ws.send(JSON.stringify(errorResponse));
	}
};
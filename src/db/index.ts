import { User } from "../types/index.js";
import { hashPassword } from "../utils/encription.js";

const usersDB = new Map<string, User>();
let newUserIndex = 0;

export const findUserByName = (name: string): User | undefined => {
	return usersDB.get(name);
}

export const createUser = (name: string, password: string): User => {
	const { salt, passwordHash } = hashPassword(password);

	const newUser: User = {
		name,
		passwordHash,
		salt,
		index: newUserIndex++,
	};

	usersDB.set(name, newUser);
	return newUser;
};
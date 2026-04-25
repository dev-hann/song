import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, '../../data/users.json');

export interface User {
  email: string;
  name: string;
  picture?: string;
  registeredAt: string;
}

interface UsersData {
  users: User[];
}

function readUsers(): UsersData {
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeUsers(data: UsersData): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export function findUser(email: string): User | undefined {
  return readUsers().users.find((u) => u.email === email);
}

export function registerUser(user: User): void {
  const data = readUsers();
  if (data.users.find((u) => u.email === user.email)) return;
  data.users.push(user);
  writeUsers(data);
}

export function getAllUsers(): User[] {
  return readUsers().users;
}

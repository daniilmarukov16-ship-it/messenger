import { User, Message, Chat } from './types';

const K = {
  users: 'meet_users',
  messages: 'meet_messages',
  chats: 'meet_chats',
  session: 'meet_current_user',
  theme: 'meet_theme',
  seeded: 'meet_seeded',
};

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const read = <T>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const write = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

// ═══════════════════════ USERS ═══════════════════════

export const getUsers = (): User[] => read<User>(K.users);
export const getUser = (id: string): User | undefined => getUsers().find(u => u.id === id);
export const getUserByLogin = (login: string): User | undefined => {
  const q = login.toLowerCase();
  return getUsers().find(u => u.login.toLowerCase() === q);
};

function saveUsers(users: User[]) { write(K.users, users); }

function mkUser(login: string, password: string, displayName: string): User {
  const palette = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#3b82f6'];
  const user: User = {
    id: uid(), login, password, displayName,
    avatar: palette[Math.random() * palette.length | 0],
    status: 'В сети', lastSeen: Date.now(), createdAt: Date.now(),
  };
  const arr = getUsers(); arr.push(user); saveUsers(arr);
  return user;
}

export const updateUser = (id: string, patch: Partial<User>) => {
  const arr = getUsers();
  const i = arr.findIndex(u => u.id === id);
  if (i !== -1) { arr[i] = { ...arr[i], ...patch }; saveUsers(arr); }
};

// ═══════════════════════ AUTH ═══════════════════════

export const register = (login: string, password: string, displayName: string): User | null =>
  getUserByLogin(login) ? null : mkUser(login, password, displayName);

export const login = (login: string, password: string): User | null => {
  const u = getUserByLogin(login);
  if (u && u.password === password) { updateUser(u.id, { lastSeen: Date.now(), status: 'В сети' }); return u; }
  return null;
};

export const getCurrentUser = (): User | null => {
  const id = localStorage.getItem(K.session);
  return id ? getUser(id) || null : null;
};
export const setCurrentUser = (u: User) => localStorage.setItem(K.session, u.id);
export const clearCurrentUser = () => localStorage.removeItem(K.session);

// ═══════════════════════ CHATS ═══════════════════════

export const getChats = (): Chat[] => read<Chat>(K.chats);
const saveChats = (c: Chat[]) => write(K.chats, c);
export const getChat = (id: string): Chat | undefined => getChats().find(c => c.id === id);
export const getUserChats = (uid: string): Chat[] => getChats().filter(c => c.members.includes(uid));

export const getPrivateChat = (a: string, b: string): Chat | undefined =>
  getChats().find(c => c.type === 'private' && c.members.includes(a) && c.members.includes(b));

export const createPrivateChat = (a: string, b: string): Chat => {
  const ex = getPrivateChat(a, b); if (ex) return ex;
  const chat: Chat = { id: uid(), type: 'private', name: '', avatar: '', members: [a, b], createdAt: Date.now(), createdBy: a };
  const arr = getChats(); arr.push(chat); saveChats(arr);
  bc({ type: 'chat_created' }); return chat;
};

export const createGroupChat = (name: string, avatar: string, members: string[], by: string): Chat => {
  const chat: Chat = { id: uid(), type: 'group', name, avatar: avatar || '#7c3aed', members: [...new Set([...members, by])], createdAt: Date.now(), createdBy: by };
  const arr = getChats(); arr.push(chat); saveChats(arr);
  bc({ type: 'chat_created' }); return chat;
};

export const deleteChat = (cid: string) => {
  saveChats(getChats().filter(c => c.id !== cid));
  saveMessages(getMessages().filter(m => m.chatId !== cid));
};

// ═══════════════════════ MESSAGES ═══════════════════════

export const getMessages = (): Message[] => read<Message>(K.messages);
const saveMessages = (m: Message[]) => write(K.messages, m);
export const getChatMessages = (cid: string): Message[] =>
  getMessages().filter(m => m.chatId === cid).sort((a, b) => a.timestamp - b.timestamp);

export const sendMessage = (cid: string, sid: string, text: string, type: 'text' | 'image' = 'text'): Message => {
  const msg: Message = { id: uid(), chatId: cid, senderId: sid, text, type, timestamp: Date.now() };
  const arr = getMessages(); arr.push(msg); saveMessages(arr);
  bc({ type: 'new_message', message: msg }); return msg;
};

// ═══════════════════════ THEME ═══════════════════════

export const getTheme = (): 'dark' | 'light' => (localStorage.getItem(K.theme) as 'dark' | 'light') || 'dark';
export const setTheme = (t: 'dark' | 'light') => localStorage.setItem(K.theme, t);

// ═══════════════════════ BROADCAST CHANNEL ═══════════════════════

let _bc: BroadcastChannel | null = null;
export const initBC = (cb: (d: any) => void): (() => void) => {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  _bc = new BroadcastChannel('meet_msgr');
  _bc.onmessage = (e) => cb(e.data);
  return () => { _bc?.close(); _bc = null; };
};
const bc = (data: any) => { try { _bc?.postMessage(data); } catch {} };

// ═══════════════════════ SEARCH / CONTACTS ═══════════════════════

export const getContacts = (uid: string): User[] => {
  const ids = new Set<string>();
  getUserChats(uid).forEach(c => c.members.forEach(m => { if (m !== uid) ids.add(m); }));
  return [...ids].map(getUser).filter(Boolean) as User[];
};

export const searchUsers = (q: string, exclude?: string): User[] => {
  const lq = q.toLowerCase();
  return getUsers().filter(u => {
    if (exclude && u.id === exclude) return false;
    if (!q) return true;
    return u.login.toLowerCase().includes(lq) || u.displayName.toLowerCase().includes(lq);
  });
};

// ═══════════════════════ NOTIFICATIONS ═══════════════════════

export const requestNotifPerm = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
};

export const showNotif = (title: string, body: string) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden)
      new Notification(title, { body, icon: '/icon-192.png' });
  } catch {}
};

// ═══════════════════════ DEMO DATA ═══════════════════════

export function seedDemoData() {
  if (localStorage.getItem(K.seeded)) return;

  const a = mkUser('alice', '123456', 'Алиса Иванова');
  const b = mkUser('bob', '123456', 'Борис Петров');
  const c = mkUser('charlie', '123456', 'Чарли Смирнов');
  const d = mkUser('demo', 'demo123', 'Демо Пользователь');

  updateUser(a.id, { avatar: '#ec4899', status: 'Привет! 👋' });
  updateUser(b.id, { avatar: '#3b82f6', status: 'Доступен' });
  updateUser(c.id, { avatar: '#10b981', status: 'На работе 💼' });
  updateUser(d.id, { avatar: '#f59e0b', status: 'Изучаю MEET ✨' });

  const c1 = createPrivateChat(d.id, a.id);
  const c2 = createPrivateChat(d.id, b.id);
  const g1 = createGroupChat('Дизайн команда 🎨', '#8b5cf6', [a.id, b.id, c.id], d.id);

  sendMessage(c1.id, a.id, 'Привет! Добро пожаловать в MEET! 🎉');
  sendMessage(c1.id, d.id, 'Спасибо, Алиса! Выглядит потрясающе! 😍');
  sendMessage(c1.id, a.id, 'Правда? Мне нравится дизайн с glassmorphism!');
  sendMessage(c1.id, d.id, 'Тёмная тема такая стильная 🌙');
  sendMessage(c1.id, a.id, 'Попробуй отправить картинку или эмодзи!');

  sendMessage(c2.id, b.id, 'Привет! Видел новые функции?');
  sendMessage(c2.id, d.id, 'Ещё нет, что нового?');
  sendMessage(c2.id, b.id, 'Групповые чаты, эмодзи, тёмная тема... Много всего! 🚀');

  sendMessage(g1.id, a.id, 'Команда! Встреча сегодня в 15:00 📅');
  sendMessage(g1.id, b.id, 'Принято! 👍');
  sendMessage(g1.id, c.id, 'Подготовлю макеты 🎨');
  sendMessage(g1.id, d.id, 'Жду с нетерпением!');

  localStorage.setItem(K.seeded, '1');
}

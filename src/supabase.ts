import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqnbvjrmmfswzelaqepx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbmJ2anJtbWZzd3plbGFxZXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjY5NzgsImV4cCI6MjA5MzA0Mjk3OH0.FWuV_cLO3z1vBmfTI69TlpxTDpEGQHE3KA5qAMBwB_8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const register = async (login: string, password: string, name: string) => {
  const autoEmail = `${login}@temp-mail.org`;
  const { data, error } = await supabase.auth.signUp({
    email: autoEmail,
    password: password,
    options: { data: { name, login } }
  });
  if (error) throw error;
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      login: login,
      name: name,
      status: 'online'
    });
  }
  return data.user;
};

export const login = async (identifier: string, password: string) => {
  let email = identifier;
  if (!identifier.includes('@')) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('login', identifier)
      .single();
    if (!user) throw new Error('Пользователь не найден');
    email = `${identifier}@temp-mail.org`;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  return userData;
};

export const searchUsers = async (query: string, currentLogin: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('login, name, avatar, status')
    .neq('login', currentLogin)
    .or(`login.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data;
};

export const getUserChats = (userLogin: string) => {
  return supabase
    .from('chats')
    .select('*, messages(*)')
    .contains('participants', [userLogin])
    .order('last_message_time', { ascending: false });
};

export const getOrCreatePrivateChat = async (user1: string, user2: string) => {
  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .contains('participants', [user1, user2])
    .eq('is_group', false)
    .maybeSingle();
  if (existing) return existing;
  
  const { data: chat, error } = await supabase
    .from('chats')
    .insert({ is_group: false, participants: [user1, user2] })
    .select()
    .single();
  if (error) throw error;
  return chat;
};

export const sendMessage = async (chatId: string, senderLogin: string, text: string, imageUrl?: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_login: senderLogin, text, image_url: imageUrl || null })
    .select()
    .single();
  if (error) throw error;
  
  await supabase
    .from('chats')
    .update({ last_message: text, last_message_time: new Date() })
    .eq('id', chatId);
  return data;
};

export const subscribeToMessages = (chatId: string, onNewMessage: (msg: any) => void) => {
  return supabase
    .channel(`chat-${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`
    }, (payload) => onNewMessage(payload.new))
    .subscribe();
};

export const uploadImage = async (file: File, userId: string): Promise<string> => {
  const fileName = `${userId}/${Date.now()}.${file.name.split('.').pop()}`;
  await supabase.storage.from('chat-images').upload(fileName, file);
  const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);
  return data.publicUrl;
};

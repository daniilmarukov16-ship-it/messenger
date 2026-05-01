import React, { useState, useEffect } from 'react';
import { supabase, getUserChats, sendMessage, subscribeToMessages, searchUsers, getOrCreatePrivateChat } from '../supabase';

interface MessengerProps {
  user: any;
  onLogout: () => void;
}

export const Messenger: React.FC<MessengerProps> = ({ user, onLogout }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'search'>('chats');

  const currentLogin = user?.login;

  // Загрузка чатов
  useEffect(() => {
    if (!currentLogin) return;
    
    const loadChats = async () => {
      const { data } = await getUserChats(currentLogin);
      if (data) setChats(data);
    };
    
    loadChats();
    
    const subscription = supabase
      .channel('chats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `participants.cs.{${currentLogin}}`
      }, () => loadChats())
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, [currentLogin]);

  // Подписка на сообщения
  useEffect(() => {
    if (!selectedChat) return;
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    
    loadMessages();
    
    const unsubscribe = subscribeToMessages(selectedChat.id, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });
    
    return () => { unsubscribe.then(unsub => unsub()); };
  }, [selectedChat]);

  // Отправка сообщения
  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat || !currentLogin) return;
    
    await sendMessage(selectedChat.id, currentLogin, inputText);
    setInputText('');
  };

  // Поиск
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchUsers(searchQuery, currentLogin);
    setSearchResults(results || []);
  };

  // Начать чат
  const startChat = async (targetLogin: string) => {
    const chat = await getOrCreatePrivateChat(currentLogin, targetLogin);
    setSelectedChat(chat);
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('chats');
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Левая панель */}
      <div className="w-80 flex flex-col bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            MEET
          </h1>
          <p className="text-gray-400 text-sm mt-1">{user?.name} (@{user?.login})</p>
        </div>
        
        {/* Вкладки */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-3 text-center transition ${activeTab === 'chats' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            Чаты
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-center transition ${activeTab === 'search' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            Поиск
          </button>
        </div>
        
        {/* Поиск */}
        {activeTab === 'search' && (
          <div className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Логин или имя..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                Найти
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(user => (
                  <button
                    key={user.login}
                    onClick={() => startChat(user.login)}
                    className="w-full p-3 text-left bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                  >
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-gray-400">@{user.login}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Список чатов */}
        {activeTab === 'chats' && (
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Нет чатов. Начните диалог через поиск!
              </div>
            )}
            {chats.map(chat => {
              let chatName = chat.is_group ? chat.name : chat.participants?.find((p: string) => p !== currentLogin) || 'Чат';
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-700 transition border-l-4 ${
                    selectedChat?.id === chat.id ? 'border-purple-500 bg-gray-700' : 'border-transparent'
                  }`}
                >
                  <div className="font-medium text-white">{chatName}</div>
                  <div className="text-sm text-gray-400 truncate">{chat.last_message || 'Нет сообщений'}</div>
                </button>
              );
            })}
          </div>
        )}
        
        <button
          onClick={onLogout}
          className="m-4 p-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
        >
          Выйти
        </button>
      </div>
      
      {/* Правая панель - чат */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <h2 className="text-xl font-semibold text-white">
                {selectedChat.is_group ? selectedChat.name : selectedChat.participants?.find((p: string) => p !== currentLogin) || 'Чат'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_login === currentLogin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender_login === currentLogin
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.image_url && (
                      <img src={msg.image_url} alt="attachment" className="max-w-full rounded-lg mb-2 max-h-48" />
                    )}
                    <p>{msg.text}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSend}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition"
                >
                  Отправить
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Выберите чат чтобы начать общение
          </div>
        )}
      </div>
    </div>
  );
};

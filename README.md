# MEET Messenger 🔮

**Modern PWA Messenger** с красивым glassmorphism UI, тёмной темой по умолчанию и поддержкой установки на телефон.

![MEET Messenger](https://img.shields.io/badge/MEET-Messenger-7c3aed?style=for-the-badge)
![React](https://img.shields.io/badge/React-18+-61dafb?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-green?style=flat-square)

---

## ✨ Функционал

- 🔐 **Авторизация** — регистрация и вход по логину + паролю
- 💬 **Личные чаты** — отправка текста, эмодзи, изображений (до 5 МБ)
- 👥 **Групповые чаты** — создание групп с выбором участников и цвета
- 🔍 **Поиск пользователей** — по логину и имени
- 📇 **Контакты** — список пользователей из ваших диалогов
- 🌙 **Тёмная/Светлая тема** — переключение в профиле или боковом меню
- 📱 **PWA** — установка на рабочий стол телефона (manifest + service worker)
- 🔔 **Push-уведомления** — поддержка браузерных уведомлений
- 📡 **Real-time** — синхронизация между вкладками через BroadcastChannel
- 📱 **Mobile-first** — адаптивный дизайн с нижней навигацией
- 🎨 **Glassmorphism** — стеклянные эффекты, градиенты, анимации

---

## 🚀 Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Запуск локально

```bash
npm run dev
```

Откройте http://localhost:5173 в браузере.

### 3. Демо-аккаунт

При первом запуске автоматически создаются тестовые пользователи:

| Логин   | Пароль   | Имя             |
|---------|----------|-----------------|
| demo    | demo123  | Demo User       |
| alice   | 123456   | Alice Johnson   |
| bob     | 123456   | Bob Smith       |
| charlie | 123456   | Charlie Brown   |

### 4. Сборка для продакшена

```bash
npm run build
```

Результат будет в папке `dist/`.

---

## 📱 Установка на телефон (PWA)

### Android (Chrome)
1. Откройте сайт в Chrome
2. Нажмите ⋮ (меню) → "Установить приложение"
3. Подтвердите установку

### iOS (Safari)
1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (↑)
3. Выберите "На экран Домой"
4. Нажмите "Добавить"

---

## 🛠 Технологии

| Компонент       | Технология              |
|-----------------|-------------------------|
| Фронтенд        | React 18 + TypeScript   |
| Стили           | Tailwind CSS            |
| Иконки          | Lucide React            |
| Сборка          | Vite                    |
| Хранилище       | localStorage            |
| Real-time sync  | BroadcastChannel API    |
| PWA             | Service Worker + Manifest |

---

## 🌐 Бесплатный деплой

### Vercel (рекомендуется)

```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel
```

### Netlify

1. Создайте аккаунт на netlify.com
2. Подключите Git-репозиторий
3. Настройки сборки: `npm run build`, папка: `dist`

### GitHub Pages

```bash
npm run build
# Деплойте папку dist/ через GitHub Pages
```

---

## 📁 Структура проекта

```
src/
├── App.tsx                    # Точка входа, роутинг Auth/Messenger
├── main.tsx                   # React root
├── index.css                  # Глобальные стили, анимации, glassmorphism
├── types.ts                   # TypeScript интерфейсы
├── store.ts                   # localStorage CRUD, BroadcastChannel, демо-данные
└── components/
    ├── Auth.tsx               # Экран входа/регистрации
    └── Messenger.tsx          # Основной мессенджер (все вкладки, чаты, модалки)

public/
├── manifest.json              # PWA манифест
├── sw.js                      # Service Worker (офлайн, кэш, push)
├── icon-192.png               # Иконка 192x192
└── icon-512.png               # Иконка 512x512
```

---

## 🔄 Подключение к реальному бэкенду (опционально)

### Firebase Firestore (бесплатно до 1 ГБ)

Для подключения Firebase замените функции в `store.ts`:

```typescript
// Пример: замена sendMessage
import { collection, addDoc } from 'firebase/firestore';
const db = getFirestore(app);

export async function sendMessage(chatId: string, senderId: string, text: string) {
  await addDoc(collection(db, 'messages'), {
    chatId, senderId, text, timestamp: serverTimestamp()
  });
}
```

### Supabase (бесплатно до 500 МБ)

```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(URL, KEY);

// Realtime подписка
supabase.channel('messages').on('INSERT', payload => {
  // обработка нового сообщения
}).subscribe();
```

---

## 📊 Лимиты бесплатных сервисов

| Сервис        | Бесплатный лимит               |
|---------------|--------------------------------|
| Vercel        | 100 ГБ带宽/мес                 |
| Firebase      | 1 ГБ Firestore, 5 ГБ Storage   |
| Supabase      | 500 МБ DB, 1 ГБ Storage        |
| FCM (Push)    | 10,000 уведомлений/мес         |

Этих лимитов хватит для 100-500 пользователей.

---

## ⌨️ Горячие клавиши

- `Enter` — отправить сообщение
- `Shift+Enter` — новая строка (в текстовом поле)

---

## 📝 Лицензия

MIT — используйте свободно!

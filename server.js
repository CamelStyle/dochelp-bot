const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = '8865682175:AAHIC1VrROl7yDpCxZjBhuNQNES9v2GHdD4';
const OPERATORS_GROUP_ID = -1004295690771;  // ID твоей группы

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
app.use(express.json());

// Хранилище userId -> messageId в группе
const userChats = new Map();

// Команда /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    '👋 Здравствуйте! Я бот поддержки DocHelp Israel.\n\n' +
    'Напишите ваш вопрос — оператор ответит в ближайшее время.'
  );
});

// Сообщения от пользователей (в личке) → пересылаем в группу
bot.on('message', async (msg) => {
  if (msg.chat.id.toString() === OPERATORS_GROUP_ID.toString()) return;
  if (msg.from.is_bot) return;
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Пользователь';
  const username = msg.from.username || 'нет';
  
  const operatorText = 
    `👤 *Вопрос от ${userName}*\n` +
    `Username: @${username}\n` +
    `ID: \`${userId}\`\n\n` +
    `💬 ${msg.text}\n\n` +
    `↩️ *Ответьте reply*`;
  
  try {
    const sent = await bot.sendMessage(OPERATORS_GROUP_ID, operatorText, { parse_mode: 'Markdown' });
    userChats.set(userId, sent.message_id);
  } catch (e) {
    console.error(e);
  }
});

// Ответ оператора в группе → пересылаем пользователю
bot.on('message', async (msg) => {
  if (msg.chat.id.toString() !== OPERATORS_GROUP_ID.toString()) return;
  if (msg.from.is_bot) return;
  if (!msg.reply_to_message || !msg.reply_to_message.text) return;
  
  // Ищем ID пользователя в форматированном тексте
  const text = msg.reply_to_message.text;
  const match = text.match(/ID: `(\d+)`/);
  if (!match) return;
  
  const userId = parseInt(match[1]);
  const replyText = msg.text;
  if (!replyText) return;
  
  try {
    await bot.sendMessage(userId, 
      `💬 *Ответ поддержки:*\n\n${replyText}\n\n_Есть ещё вопросы? Напишите!_`,
      { parse_mode: 'Markdown' }
    );
    bot.sendMessage(OPERATORS_GROUP_ID, '✅ Отправлено', {
      reply_to_message_id: msg.message_id
    });
  } catch (e) {
    bot.sendMessage(OPERATORS_GROUP_ID, 
      `❌ Не отправлено. Возможно, юзер не начинал чат с ботом.`,
      { reply_to_message_id: msg.message_id }
    );
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot server on port ${PORT}`));

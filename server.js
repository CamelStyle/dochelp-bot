const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = '8865682175:AAHIC1VrROl7yDpCxZjBhuNQNES9v2GHdD4';
const OPERATORS_GROUP_ID = -1004295690771;

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
app.use(express.json());

// Команда /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    '👋 Здравствуйте! Я бот поддержки DocHelp Israel.\n\n' +
    'Напишите ваш вопрос — оператор ответит в ближайшее время.'
  );
});

// ЕДИНСТВЕННЫЙ обработчик сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = chatId.toString() === OPERATORS_GROUP_ID.toString();
  const isFromBot = msg.from.is_bot;
  
  // Игнорируем ботов
  if (isFromBot) return;
  // Игнорируем сообщения без текста
  if (!msg.text) return;
  // Игнорируем команды
  if (msg.text.startsWith('/')) return;
  
  // ===== Сообщение от ПОЛЬЗОВАТЕЛЯ (в личке) =====
  if (!isGroup) {
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
      console.log(`✅ Forwarded to group: ${userId} -> ${sent.message_id}`);
    } catch (e) {
      console.error('❌ Forward error:', e.message);
    }
  }
  
  // ===== Сообщение от ОПЕРАТОРА (в группе, reply) =====
  else if (msg.reply_to_message && msg.reply_to_message.text) {
    const text = msg.reply_to_message.text;
    const match = text.match(/ID: `(\d+)`/);
    if (!match) return;
    
    const userId = parseInt(match[1]);
    const replyText = msg.text;
    
    try {
      await bot.sendMessage(userId, 
        `💬 *Ответ поддержки:*\n\n${replyText}`,
        { parse_mode: 'Markdown' }
      );
      console.log(`✅ Reply sent to: ${userId}`);
      bot.sendMessage(OPERATORS_GROUP_ID, '✅ Отправлено', {
        reply_to_message_id: msg.message_id
      });
    } catch (e) {
      console.error('❌ Reply error:', e.message);
      bot.sendMessage(OPERATORS_GROUP_ID, `❌ Ошибка: ${e.message}`, {
        reply_to_message_id: msg.message_id
      });
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Bot server on port ${PORT}`));

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = '8865682175:AAHIC1VrROl7yDpCxZjBhuNQNES9v2GHdD4';
const OPERATORS_GROUP_ID = -1004295690771;

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
app.use(express.json());

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Здравствуйте! Напишите ваш вопрос.');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = chatId.toString() === OPERATORS_GROUP_ID.toString();
  const isFromBot = msg.from.is_bot;
  
  if (isFromBot) return;
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;
  
  // ЛОГ ВСЕХ СООБЩЕНИЙ
  console.log(`📩 Message: chat=${chatId}, group=${isGroup}, text="${msg.text.substring(0, 30)}", reply_to=${!!msg.reply_to_message}`);
  
  // Сообщение от пользователя
  if (!isGroup) {
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'User';
    
    const operatorText = 
      `👤 *${userName}* (ID: \`${userId}\`)\n\n` +
      `💬 ${msg.text}`;
    
    try {
      const sent = await bot.sendMessage(OPERATORS_GROUP_ID, operatorText, { parse_mode: 'Markdown' });
      console.log(`✅ Forwarded ${userId} -> group msg ${sent.message_id}`);
    } catch (e) {
      console.error(`❌ Forward error: ${e.message}`);
    }
    return;
  }
  
  // Сообщение в группе
  if (isGroup && msg.reply_to_message) {
    console.log(`💬 Group reply: "${msg.text}"`);
    console.log(`   reply_to text: "${(msg.reply_to_message.text || '').substring(0, 100)}"`);
    
    const text = msg.reply_to_message.text || '';
    const match = text.match(/ID: (\d+)/);
    
    if (!match) {
      console.log(`❌ No ID match in: "${text}"`);
      return;
    }
    
    const userId = parseInt(match[1]);
    console.log(`🔍 Parsed user ID: ${userId}`);
    
    try {
      await bot.sendMessage(userId, `💬 *Ответ поддержки:*\n\n${msg.text}`, { parse_mode: 'Markdown' });
      console.log(`✅ Reply sent to ${userId}`);
    } catch (e) {
      console.error(`❌ Reply error: ${e.message}`);
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Bot on port ${PORT}`));

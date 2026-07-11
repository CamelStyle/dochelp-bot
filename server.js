const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = '8865682175:AAHIC1VrROl7yDpCxZjBhuNQNES9v2GHdD4';
const OPERATORS_GROUP_ID = -1004295690771;
const WEBHOOK_URL = 'https://dochelp-bot.onrender.com';

const bot = new TelegramBot(TOKEN);
const app = express();
app.use(express.json());

// Команда /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    '👋 Здравствуйте! Я бот поддержки DocHelp Israel.\n\n' +
    'Напишите ваш вопрос — оператор ответит в ближайшее время.'
  );
});

// Обработка всех сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = chatId.toString() === OPERATORS_GROUP_ID.toString();
  const isFromBot = msg.from ? msg.from.is_bot : false;
  
  if (isFromBot) return;
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;
  
  console.log(`📩 chat=${chatId} group=${isGroup} text="${msg.text.substring(0, 50)}" reply_to=${!!msg.reply_to_message}`);
  
  // ===== Сообщение от ПОЛЬЗОВАТЕЛЯ (в личке) =====
  if (!isGroup) {
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'Пользователь';
    const lastName = msg.from.last_name || '';
    const username = msg.from.username ? `@${msg.from.username}` : 'не указан';
    const fullName = lastName ? `${userName} ${lastName}` : userName;
    
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU', { timeZone: 'Asia/Jerusalem' });
    
    // ✅ КРАСИВОЕ сообщение для операторов
    const operatorText = 
      `🆕 *Новое сообщение от клиента*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Имя:* ${fullName}\n` +
      `🔗 *Username:* ${username}\n` +
      `🆔 *ID:* \`${userId}\`\n` +
      `🕐 *Время:* ${dateStr}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `💬 *Сообщение:*\n` +
      `${msg.text}\n\n` +
      `↩️ *Ответьте reply на это сообщение*`;
    
    try {
      const sent = await bot.sendMessage(OPERATORS_GROUP_ID, operatorText, { parse_mode: 'Markdown' });
      console.log(`✅ Forwarded to group: user=${userId} -> msg=${sent.message_id}`);
    } catch (e) {
      console.error(`❌ Forward error: ${e.message}`);
    }
    return;
  }
  
  // ===== Ответ ОПЕРАТОРА (в группе, reply) =====
  if (isGroup && msg.reply_to_message) {
    const text = msg.reply_to_message.text || '';
    const match = text.match(/ID:\s*(\d+)/);
    
    if (!match) {
      console.log(`❌ No ID in: "${text.substring(0, 80)}"`);
      return;
    }
    
    const userId = parseInt(match[1]);
    const operatorName = msg.from.first_name || 'Оператор';
    
    console.log(`🔍 Sending reply to user ${userId} from ${operatorName}: "${msg.text}"`);
    
    try {
      // ✅ КРАСИВЫЙ ответ пользователю
      const userReply = 
        `💬 *Ответ от поддержки DocHelp*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `${msg.text}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👨‍💼 Оператор: ${operatorName}\n` +
        `📅 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Jerusalem' })}\n\n` +
        `💡 Если остались вопросы — напишите ещё раз!`;
      
      await bot.sendMessage(userId, userReply, { parse_mode: 'Markdown' });
      console.log(`✅ Reply sent to user ${userId}`);
      
      // Подтверждение оператору
      bot.sendMessage(OPERATORS_GROUP_ID, '✅ Отправлено клиенту', {
        reply_to_message_id: msg.message_id
      });
    } catch (e) {
      console.error(`❌ Reply error: ${e.message}`);
      bot.sendMessage(OPERATORS_GROUP_ID, 
        `❌ *Не удалось отправить*\n\n` +
        `Ошибка: ${e.message}\n\n` +
        `💡 Возможно, клиент ещё не нажал /start у бота.`,
        { 
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id 
        }
      );
    }
  }
});

// Webhook endpoint
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('DocHelp Bot is running!');
});

// Запуск
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Bot webhook server on port ${PORT}`);
  bot.setWebHook(`${WEBHOOK_URL}/webhook/${TOKEN}`).then(() => {
    console.log('✅ Webhook set successfully');
  }).catch(err => {
    console.error('❌ Webhook error:', err.message);
  });
});

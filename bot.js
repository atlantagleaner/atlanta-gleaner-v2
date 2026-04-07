require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Welcome to the Gleaner Bridge Bot! How can I help you today?');
});

bot.help((ctx) => {
  ctx.reply('Send me a message and I will process it.');
});

bot.on('text', (ctx) => {
  ctx.reply(`You said: ${ctx.message.text}`);
});

bot.launch().then(() => {
  console.log('Gleaner Bridge Bot is running...');
}).catch((err) => {
  console.error('Failed to launch bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

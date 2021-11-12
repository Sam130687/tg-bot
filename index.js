const Koa = require('koa');
const { Telegraf } = require('telegraf');
const safeCompare = require('safe-compare')
const sample = require('lodash/sample');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Let's start!"));

bot.on('sticker', (ctx) => {
    const { sticker } = ctx.update.message;

    bot.telegram.getStickerSet(sticker.set_name)
        .then(set => ctx.replyWithSticker(sample(set.stickers).file_id))
        .catch((err) => {
            console.error(err);
            return ctx.reply('👍');
        });
});

const keyboard = [
    [
      {
        text: 'Хочу кота', // текст на кнопке
        callback_data: 'moreKeks' // данные для обработчика событий
      }
    ],
    [
      {
        text: 'Хочу песика',
        callback_data: 'morePes'
      }
    ],
    [
      {
        text: 'Хочу проходить курсы',
        url: 'https://htmlacademy.ru/courses' //внешняя ссылка
      }
    ]
  ];

// Обработчик нажатий на клавиатуру
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
  
    let img = '';
  
    if (query.data === 'moreKeks') { // если кот
      img = 'keks.png';
    }
  
    if (query.data === 'morePes') { // если пёс
      img = 'pes.png';
    }
  
    if (img) {
      bot.sendMessage(chatId, img, { // прикрутим клаву
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } else {
      bot.sendMessage(chatId, 'Непонятно, давай попробуем ещё раз?', {
        // прикрутим клаву
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
  });  

bot.on('message', (ctx) => {
    ctx.reply('You send ' + ctx.query.message, { // прикрутим клаву
        reply_markup: {
            inline_keyboard: keyboard
        }});
});

const secretPath = `/telegraf/${bot.secretPathComponent()}`;

bot.telegram.setWebhook(`${process.env.URL}${secretPath}`);

const app = new Koa();

app.use(require('koa-bodyparser')());
app.use(async (ctx, next) => {
    if (safeCompare(secretPath, ctx.url)) {
        await bot.handleUpdate(ctx.request.body)
        ctx.body = 'ok';
        return;
    }
    return next();
})
app.listen(process.env.PORT);

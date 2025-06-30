import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;

  private kinoMap: Record<string, string> = {
    '3': 'https://t.me/kino_server_chanel/3',
    '4': 'https://t.me/kino_server_chanel/4',
    '5': 'https://t.me/kino_server_chanel/5',
    '7': 'https://t.me/kino_server_chanel/7',
    '8': 'https://t.me/kino_server_chanel/8',
    '9': 'https://t.me/kino_server_chanel/9',
  };

  private channelUsername = '@kino_server_chanel';

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN topilmadi. .env faylni tekshiring.');
    }

    this.bot = new Telegraf(token);
  }

  onModuleInit() {
    this.bot.start((ctx) => {
      ctx.reply(`Salom ${ctx.from.first_name} ! Kerakli kino kodini yuboring`);
    });

    this.bot.on('text', async (ctx) => {
      const code = ctx.message.text.trim();
      const link = this.kinoMap[code];

      if (!link) {
        return ctx.reply('Kechirasiz, bu kod bo‘yicha kino topilmadi.');
      }

      const match = link.match(/\/(\d+)$/);
      if (!match) {
        return ctx.reply('Link noto‘g‘ri formatda.');
      }

      const messageId = parseInt(match[1], 10);

      try {
        await ctx.telegram.forwardMessage(
          ctx.chat.id,
          this.channelUsername, 
          messageId, 
        );
      } catch (error) {
        console.error('Postni forward qilishda xatolik:', error);
        ctx.reply('Kechirasiz, kinoni yuborib bo‘lmadi.');
      }
    });

    this.bot.launch();
    console.log('🤖 Bot ishga tushdi!');
  }
}

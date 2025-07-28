import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private kinoMap: Record<string, string> = {};

  private channelUsername = '@kino_server_chanel';
  private kinoFilePath = path.join(process.cwd(), 'kinoMap.json'); 

  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN topilmadi. .env faylni tekshiring.');
    }

    this.bot = new Telegraf(token);
    this.loadKinoMapFromFile();
  }

  onModuleInit() {
    this.bot.start((ctx) => {
      ctx.reply(`Salom ${ctx.from.first_name}! Kerakli kino kodini yuboring.`);
    });

    this.bot.command('movies', async (ctx) => {
  const keys = Object.keys(this.kinoMap);
  
  if (keys.length === 0) {
    return ctx.reply('📭 Hech qanday kino topilmadi.');
  }

  let message = '🎬 Saqlangan kinolar:\n\n';
  keys.forEach((id) => {
    const link = this.kinoMap[id];
    message += `🎥 ID: ${id} - [Havola](${link})\n`;
  });

  return ctx.reply(message, { parse_mode: 'Markdown' });
});
  

    this.bot.on('text', async (ctx) => {
      const code = ctx.message.text.trim();
      const link = this.kinoMap[code];
      // return ctx.reply()

      if (!link) {
        return ctx.reply('Kechirasiz, bu kod bo‘yicha kino topilmadi.');
      }

      const match = link.match(/\/(\d+)$/);
      if (!match) {
        return ctx.reply('Link noto‘g‘ri formatda.');
      }

      const messageId = parseInt(match[1], 10);

      try {
        await ctx.telegram.copyMessage(
          ctx.chat.id,
          this.channelUsername,
          messageId,
          { message_thread_id: undefined },
        );
      } catch (error) {
        console.error('Videoni yuborishda xatolik:', error);
        ctx.reply('Kechirasiz, kinoni yuborib bo‘lmadi.');
      }
    });

    // Yangi post kanalga chiqsa, avtomatik kinoMap.json'ga qo‘shish
    this.bot.on('channel_post', async (ctx) => {
      const msg = ctx.channelPost;
      if (!("video" in msg)) return;

      const messageId = msg.message_id;
      const link = `https://t.me/kino_server_chanel/${messageId}`;

      if (!this.kinoMap[`${messageId}`]) {
        this.kinoMap[`${messageId}`] = link;
        this.saveKinoMapToFile();
        console.log(`✅ Yangi kino qo‘shildi: ${messageId} => ${link}`);
      }
    });

    this.bot.launch();
    console.log('🤖 Bot ishlayapti');
  }

  private loadKinoMapFromFile() {
    try {
      if (fs.existsSync(this.kinoFilePath)) {
        const data = fs.readFileSync(this.kinoFilePath, 'utf-8');
        this.kinoMap = JSON.parse(data);
        console.log('📂 kinoMap fayldan yuklandi');
      } else {
        console.log('ℹ️ kinoMap.json topilmadi, yangi fayl yaratiladi');
        this.kinoMap = {};
        this.saveKinoMapToFile();
      }
    } catch (err) {
      console.error('❌ kinoMap.jsonni yuklashda xatolik:', err);
      this.kinoMap = {};
    }
  }

  private saveKinoMapToFile() {
    try {
      fs.writeFileSync(
        this.kinoFilePath,
        JSON.stringify(this.kinoMap, null, 2),
        'utf-8',
      );
      console.log('💾 kinoMap faylga saqlandi');
    } catch (err) {
      console.error('❌ Faylga yozishda xatolik:', err);
    }
  }
}

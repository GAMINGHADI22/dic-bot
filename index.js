require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// queue system
let queue = [];
let player = createAudioPlayer();
let connection;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// play function
function playNext(message) {
  if (queue.length === 0) {
    message.channel.send('Queue sesh 😴');
    return;
  }

  const url = queue[0];
  const stream = ytdl(url, { filter: 'audioonly' });
  const resource = createAudioResource(stream);

  player.play(resource);
  connection.subscribe(player);

  message.channel.send(`🎶 Now playing: ${url}`);
}

// auto play next
player.on(AudioPlayerStatus.Idle, () => {
  queue.shift();
  if (queue.length > 0) {
    playNext(global.messageRef);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0];

  // PLAY
  if (command === '!play') {
    const url = args[1];
    if (!url) return message.reply('Link dao!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Voice e join koro!');

    queue.push(url);

    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
    }

    global.messageRef = message;

    if (queue.length === 1) {
      playNext(message);
    } else {
      message.reply('Queue te add hoise ✅');
    }
  }

  // SKIP
  if (command === '!skip') {
    player.stop();
    message.reply('⏭️ Skip kora hoise!');
  }

  // PAUSE
  if (command === '!pause') {
    player.pause();
    message.reply('⏸️ Pause kora hoise!');
  }

  // RESUME
  if (command === '!resume') {
    player.unpause();
    message.reply('▶️ Resume kora hoise!');
  }

  // QUEUE SHOW
  if (command === '!queue') {
    if (queue.length === 0) return message.reply('Queue empty!');

    let list = queue.map((song, i) => `${i + 1}. ${song}`).join('\n');
    message.reply(`📜 Queue:\n${list}`);
  }
});

client.login(process.env.TOKEN);

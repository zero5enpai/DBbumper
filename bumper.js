const Discord = require('discord.js-selfbot-v13');
const { DateTime } = require('luxon');
const client = new Discord.Client({ checkUpdate: false });

const fs = require('fs');
const path = require('path');

// Define regular expressions for matching cooldown times in minutes and seconds
const regm = /Please wait(?: another | )([0-9]{1,3}) minutes/gm;
const regs = /Please wait(?: another | )([0-9]{1,3}) seconds/gm;

// Define constants for targeted channel and bot ID
const CHANNEL_ID = 'ID';
const BOT_TARGET_ID = 'ID';

const TZ = 'Europe/Berlin'; // Replace with your timezone (https://www.iana.org/time-zones)

// Define the base cooldown, minimal random and maximal random time in milliseconds
const BASE_CD = 7200000;
const MINRND = 61000;
const MAXRND = 1800000;
const cmd = 'bump';

// Error logging | you have to monitor space by your own, delete if unwanted
const errorDir = path.join(__dirname, 'logs');
if (!fs.existsSync(errorDir)) {
    fs.mkdirSync(errorDir);
}
const errorFile = path.join(errorDir, `${getTime()}.txt`);
const logStream = fs.createWriteStream(errorFile, { flags: 'a' });


let t;
let DELAYED_CD = BASE_CD;
let goal;
let channel = client.channels.cache.get(CHANNEL_ID);

client.on('ready', async () => {
    console.clear();

    console.log(`> ready <`);

    client.user.setStatus('idle');
    channel = client.channels.cache.get(CHANNEL_ID);
    sendingSlash();
});

client.on('rateLimit', (info) => {
    console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}`);
    console.log(`Rate limit limit: ${info.limit}`);
    console.log(`Rate limit method: ${info.method}`);
    console.log(`Rate limit path: ${info.path}`);
    console.log(`Rate limit route: ${info.route}`);
});

//if cooldown is detected, wait for cooldown to end and then bump
client.on('messageCreate', (msg) => {
    if (msg == null || msg.author == null) return;
    if (msg.channelId != CHANNEL_ID || msg.author.id != BOT_TARGET_ID) return;

    for (let i = 0; i < msg.embeds.length; i++) {
        let embed = msg.embeds[i];
        let x;

        // Check for cooldown in minutes
        if ((x = regm.exec(embed.description)) != null) {
            handleCooldown(x[1] * 60000);
        }

        // Check for cooldown in seconds
        if ((x = regs.exec(embed.description)) != null) {
            handleCooldown(x[1] * 1000);
        }

        // Check if bump is successful or stolen
        if (embed.description.includes('Bump done')) {
            if (msg.interaction.user != client.user.id) {
                let DELAYED_CD = updateDelayedCD(BASE_CD);
                clearTimeout(t);
                client.users.fetch(msg.interaction.user).then(target => {
                    console.log(`> bump stolen by ${target.globalName}(${target.username}), next bump in 2 hours ~> ${getTime(DELAYED_CD)}`);
                });
                t = setTimeout(() => {
                    sendingSlash();
                }, DELAYED_CD);
            }
            else if (msg.interaction.user == client.user.id) {
                let DELAYED_CD = updateDelayedCD(BASE_CD);
                console.log(`> bump successful, next bump in 2 hours ~> ${getTime(DELAYED_CD)}`);
                t = setTimeout(() => {
                    sendingSlash();
                }, DELAYED_CD);
            }
        }
    }
});

function handleCooldown(delay) {
    let DELAYED_CD = updateDelayedCD(delay);
    console.log(`> on cooldown, next bump in ${getTime(DELAYED_CD)}`);
    t = setTimeout(() => {
        sendingSlash();
    }, DELAYED_CD);
}

async function richPresence() {

    let start = dateDelay();

    if ((goal - start) > 86400000) {

        setTimeout(() => {

            console.log(`> setting rich presence <`);

            spotify = new Discord.SpotifyRPC(client)
                .setAssetsLargeImage('spotify:ab67616100005174448c3cbb2515fadba5f12673')
                .setAssetsLargeText('0x003')
                .setAssetsSmallImage('spotify:ab6761610000f178e51d591c4a6cff195f11e150')
                .setDetails('Managing bumping')
                .setState('orbiting...')
                .setStartTimestamp(Date.now())
                .setEndTimestamp(goal)
                .setSongId('4EZvIph0m6dAAhUZqIGscv')
                .setAlbumId('2TnRMOKYUDygY2LYqCAzi0')
                .setArtistIds(['6x9CKUBQ96VjXxKgGE5hIw'])
            client.user.setPresence({
                activities: [spotify]
            });
        }, (start + 86400000) - Date.now());
    }

    console.log(`> setting rich presence <`);

    spotify = new Discord.SpotifyRPC(client)
        .setAssetsLargeImage('spotify:ab67616100005174448c3cbb2515fadba5f12673')
        .setAssetsLargeText('0x003')
        .setAssetsSmallImage('spotify:ab6761610000f178e51d591c4a6cff195f11e150')
        .setDetails('Managing bumping')
        .setState('orbiting...')
        .setStartTimestamp(start)
        .setEndTimestamp(goal)
        .setSongId('4EZvIph0m6dAAhUZqIGscv')
        .setAlbumId('2TnRMOKYUDygY2LYqCAzi0')
        .setArtistIds(['6x9CKUBQ96VjXxKgGE5hIw'])
    client.user.setPresence({
        activities: [spotify]
    });
}

function dateDelay() {
    let now = DateTime.local().setZone(TZ);
    let startOfDay = now.startOf('day');
    return timestamp = startOfDay.ts;
}

function updateDelayedCD(delay) {
    DELAYED_CD = delay + getRndInteger(MINRND, MAXRND);
    goal = Date.now() + DELAYED_CD;
    richPresence();
    return DELAYED_CD;
}

function sendingSlash() {
    try {
        channel.sendSlash(BOT_TARGET_ID, cmd);
        console.log(`> attempted bump`);
        console.log(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    }
    catch (err) {
        console.log(err);
    }
}

function getTime(ms) {
    const now = DateTime.local().setZone(TZ);
    const newTime = now.plus({ milliseconds: ms });
    const formattedTime = newTime.toFormat('[dd HH:mm:ss]');
    return formattedTime
};

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

process.on('uncaughtException', (err) => {
    console.log(`Caught exception: ${err}\n`);
});

process.on('unhandledRejection', (reason, p) => {
    console.log(`Unhandled Rejection at: Promise ${p}, reason: ${reason}\n`);
});

console.log = function (msg) {
    logStream.write(`${getTime()} | ${msg}\n`);
    process.stdout.write(`${getTime()} | ${msg}\n`);
};

client.login('TOKEN');

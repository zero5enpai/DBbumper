const Discord = require('discord.js-selfbot-v13');
const { DateTime } = require('luxon');
const client = new Discord.Client({ checkUpdate: false });

// Define regular expressions for matching cooldown times in minutes and seconds
const regm = /Please wait(?: another | )([0-9]{1,3}) minutes/gm;
const regs = /Please wait(?: another | )([0-9]{1,3}) seconds/gm;

// Define constants for targeted channel and user ID (targeted Bot ID)
const CHANNEL_ID = 'ID';
const USER_ID = '302050872383242240';

// Define the base cooldown, minimal random and maximal random time in milliseconds
const BASE_CD = 7200000;
const MINRND = 61000;
const MAXRND = 120000;

// Define a variable for the timeout
let t;
let alive;

client.on('ready', async () => {
    console.clear();
    console.log(`${getTime()} | > ready <`);
    client.user.setStatus('invisible');
    const channel = client.channels.cache.get(CHANNEL_ID);
    channel.sendSlash(USER_ID, 'bump');
    console.log(`${getTime()} | > attempted bump`);
    keepAlive();
});

//if cooldown is detected, wait for cooldown to end and then bump
client.on('messageCreate', (msg) => {
    if (msg == null || msg.author == null) return;
    if (msg.channelId != CHANNEL_ID || msg.author.id != USER_ID) return;

    // Loop through the embeds in the message
    for (let i = 0; i < msg.embeds.length; i++) {
        let embed = msg.embeds[i];

        // Handle and check if the message contains a cooldown time in minutes
        if ((x = regm.exec(embed.description)) != null) {
            keepAlive();
            let DELAYED_CD = (x[1] * 60000) + getRndInteger(MINRND, MAXRND);
            console.log(`${getTime()} | > on cooldown, next bump in ${x[1]} minutes ~> ${getTime(DELAYED_CD)}`);
            t = setTimeout(() => {
                try {
                    client.user.setStatus('invisible');
                    msg.channel.sendSlash(USER_ID, 'bump');
                    console.log(`${getTime()} | > attempted bump`);
                }
                catch (err) {
                    console.log(err);
                }
            }, DELAYED_CD);
        }

        // Handle and check if the message contains a cooldown time in seconds
        if ((x = regs.exec(embed.description)) != null) {
            keepAlive();
            let DELAYED_CD = (x[1] * 1000) + getRndInteger(MINRND, MAXRND);
            console.log(`${getTime()} | > on cooldown, next bump in ${x[1]} seconds ~> ${getTime(DELAYED_CD)}`);
            t = setTimeout(() => {
                try {
                    client.user.setStatus('invisible');
                    msg.channel.sendSlash(USER_ID, 'bump');
                    console.log(`${getTime()} | > attempted bump`);
                }
                catch (err) {
                    console.log(err);
                }
            }, DELAYED_CD);
        }
    }
});

// if bump is successful or stolen, wait for cooldown to end and then bump
client.on('messageCreate', (msg) => {
    if (msg == null || msg.author == null) return;
    if (msg.channel.id != CHANNEL_ID || msg.author.id != USER_ID) return;
    for (let i = 0; i < msg.embeds.length; i++) {
        keepAlive();
        let embed = msg.embeds[i];
        if (embed.description.includes('Bump done')) {
            if (msg.interaction.user != client.user.id) {
                let DELAYED_CD = BASE_CD + getRndInteger(MINRND, MAXRND);
                clearTimeout(t);
                client.users.fetch(msg.interaction.user).then(target => {
                    console.log(`${getTime()} | > bump stolen by ${target.globalName}(${target.username}), next bump in 2 hours ~> ${getTime(DELAYED_CD)}`);
                });
                t = setTimeout(() => {
                    try {
                        client.user.setStatus('invisible');
                        msg.channel.sendSlash(USER_ID, 'bump');
                        console.log(`${getTime()} | > attempted bump`);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }, DELAYED_CD);
            }
            else if (msg.interaction.user = client.user.id) {
                let DELAYED_CD = BASE_CD + getRndInteger(MINRND, MAXRND);
                console.log(`${getTime()} | > bump successful, next bump in 2 hours ~> ${getTime(DELAYED_CD)}`);
                t = setTimeout(() => {
                    try {
                        client.user.setStatus('invisible');
                        msg.channel.sendSlash(USER_ID, 'bump');
                        console.log(`${getTime()} | > attempted bump`);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }, DELAYED_CD);
            };
        };
    };
});

function keepAlive() {
    clearTimeout(alive);
    alive = setTimeout(() => {
        try {
            client.channels.cache.get(CHANNEL_ID).sendSlash(USER_ID, 'bump');
            console.log(`${getTime()} | > attempted bump`);
            keepAlive();
        }
        catch (err) {
            console.log(err);
        }
    }, 2*BASE_CD);
}
// Function to get a random integer between min and max
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

// Function to get the current time with an optional time offset
function getTime(ms) {
    const now = DateTime.local().setZone('Europe/Berlin');
    const newTime = now.plus({ milliseconds: ms });
    const formattedTime = newTime.toFormat('[dd HH:mm:ss]');
    return formattedTime
};

client.login('TOKEN');
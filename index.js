const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();
const emoji = require('node-emoji');
const robot = emoji.get('robot');
const fire = emoji.get('fire');
const wavinghand = emoji.get('wave');
const token = process.env.TOKEN;
const port = process.env.PORT || 3030;


// express server setup
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    res.send('Working fine')
})
// const port = 3000;

const bot = new TelegramBot(token, { polling: true });
const welcomeMessagesSent = new Map();
const waitingForCityInput = new Map();

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const lastName = msg.chat.last_name
    const firstName = msg.chat.first_name
    if (!welcomeMessagesSent.get(chatId)) {
        bot.sendMessage(chatId, `Hi ${firstName.toUpperCase()} ${lastName.toUpperCase()}, Welcome to Weather Bot, Please enter the city name you want to know the weather of.`);
        welcomeMessagesSent.set(chatId, true);
        waitingForCityInput.set(chatId, true);
    } else {
        bot.sendMessage(chatId, 'Welcome back! Please enter the city name:');
        waitingForCityInput.set(chatId, true);
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.chat.username;
    const lastName = msg.chat.last_name;
    const firstName = msg.chat.first_name;

    if (!welcomeMessagesSent.get(chatId)) {
        return;
    }

    if (waitingForCityInput.get(chatId)) {
        if (!msg.text) {
            bot.sendMessage(chatId, 'Please enter a valid city name.');
            return;
        }
        const userInput = msg.text.trim();

        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${userInput},IN&appid=${process.env.API_KEY}`
            );
            const data = response.data;
            const weather = data.weather[0].description;
            const temperature = data.main.temp - 273.15;
            const city = data.name;
            const humidity = data.main.humidity;
            const pressure = data.main.pressure;
            const windSpeed = data.wind.speed;
            const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(2)}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;
            bot.sendMessage(chatId, message).then(() => {
                bot.sendMessage(chatId, "Do you want to know the weather update for another city ?");
                waitingForCityInput.set(chatId, false);
            })
        } catch (error) {
            bot.sendMessage(chatId, "City doesn't exist.");
        }
        console.log({ "User Name": userName, "Full Name": firstName + " " + lastName, "User Input": userInput });
    } else {
        const answer = msg.text.trim().toLowerCase();


        if (answer === 'yes') {
            bot.sendMessage(chatId, "Please enter the city name:");
            waitingForCityInput.set(chatId, true);
        } else if (answer === 'no') {
            bot.sendMessage(chatId, "I'm shutting down " + robot + ", to " + fire + " me again, type /start, till then have a nice day!" + wavinghand);
            waitingForCityInput.delete(chatId);
        }
        // else {
        //     bot.sendMessage(chatId, "Please enter either 'Yes' or 'No'.");
        // }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
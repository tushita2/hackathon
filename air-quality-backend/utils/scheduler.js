const cron = require('node-cron');
const axios = require('axios');
const getCoordinates = require('./healthTips');
const PollutionData = require('../../models/pollutionData'); // Assuming MongoDB setup

const API_KEY = "e9cf97c904f9cd123ca22ad8c4f8083a"; // Replace with your actual API key

const scheduleUpdates = () => {
    cron.schedule('0 * * * *', async () => {
        console.log("Scheduled job running: Updating pollution data...");
        const cities = ["Delhi", "Mumbai", "Tokyo", "New York", "Paris"];

        for (const city of cities) {
            const coordinates = await getCoordinates(city, API_KEY);
            if (!coordinates) continue;

            const { lat, lon } = coordinates;

            try {
                const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
                const response = await axios.get(url);
                console.log(`Updated pollution data for ${city}:`, response.data.list[0].main.aqi);
            } catch (error) {
                console.error(`Error updating data for ${city}:`, error.message);
            }
        }
    });
};

module.exports = scheduleUpdates;

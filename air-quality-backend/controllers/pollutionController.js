const axios = require("axios");
const getCoordinates = require("../utils/healthTips");
const i18n = require("../i18n-config");

// Load OpenWeather API Key from environment variables
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
    console.error("Error: OpenWeather API Key is missing. Please check your .env file.");
}

const getAllData = async (req, res) => {
    const city = req.query.city || "Delhi"; // Default city
    const age = req.query.age; // Optional age parameter
    const language = req.query.lang || "en"; // Default language
    await i18n.changeLanguage(language);

    try {
        // Get geocoded coordinates using OpenCage API
        const coordinates = await getCoordinates(city, process.env.OPENCAGE_API_KEY);
        if (!coordinates) {
            return res.status(400).json({
                error: i18n.t("errors.invalid_city", { city, lng: language })
            });
        }

        const { lat, lon } = coordinates;

        // Fetch real-time AQI ranking
        const realTimeUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        console.log("Fetching RealTime AQI URL:", realTimeUrl);

        const realTimeResponse = await axios.get(realTimeUrl);

        // Use the `aqi` or pollutant components to calculate/display real AQI (if needed)
        const aqi = realTimeResponse.data.list[0].main.aqi * 20; // Convert 1-5 scale to 1-100 scale (example)
        const components = realTimeResponse.data.list[0].components;

        // Enhanced AQI details
        const { description, advice } = getAQIDetails(aqi, components);

        // Fetch daily extremes
        const now = new Date();
        const startOfDay = Math.floor(now.setUTCHours(0, 0, 0, 0) / 1000);
        const endOfDay = Math.floor(now.setUTCHours(23, 59, 59, 999) / 1000);
        const dailyExtremesUrl = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${startOfDay}&end=${endOfDay}&appid=${API_KEY}`;
        console.log("Fetching Daily Extremes AQI URL:", dailyExtremesUrl);

        const dailyExtremesResponse = await axios.get(dailyExtremesUrl);
        const dailyData = dailyExtremesResponse.data.list || [];
        const minAQI = Math.min(...dailyData.map(entry => entry.main.aqi * 20)); // Scale min/max AQI
        const maxAQI = Math.max(...dailyData.map(entry => entry.main.aqi * 20));

        // Fetch annual trends
        const annualTrends = [];
        for (let month = 1; month <= 12; month++) {
            const startOfMonth = Math.floor(new Date(2022, month - 1, 1).getTime() / 1000);
            const endOfMonth = Math.floor(new Date(2022, month, 0).getTime() / 1000);
            const monthlyUrl = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${startOfMonth}&end=${endOfMonth}&appid=${API_KEY}`;
            console.log(`Fetching Monthly AQI URL for month ${month}:`, monthlyUrl);

            const monthlyResponse = await axios.get(monthlyUrl);
            const monthlyData = monthlyResponse.data.list || [];
            const averageAQI =
                monthlyData.reduce((sum, entry) => sum + entry.main.aqi * 20, 0) /
                (monthlyData.length || 1);

            annualTrends.push({
                month: new Date(2022, month - 1).toLocaleString("en", { month: "long" }),
                aqi: Math.round(averageAQI)
            });
        }

        // Add age-specific message
        const ageMessage = age
            ? i18n.t("health.age_specific", { age }) // Customize this message further
            : i18n.t("health.enter_age"); // Default message if age is not entered

        // Return aggregated data with real AQI values
        res.status(200).json({
            city,
            lat,
            lon,
            realTimeAQI: { aqi, description, advice, components },
            dailyExtremes: { min: minAQI, max: maxAQI },
            annualTrends,
            ageMessage
        });
    } catch (error) {
        console.error(`Failed to fetch data for ${city}:`, error.message);
        res.status(500).json({
            error: i18n.t("errors.fetch_failed", { city, lng: language }),
            details: error.message
        });
    }
};

// Helper: AQI Levels
const getAQIDetails = (aqi, components) => {
    const levels = {
        1: {
            description: i18n.t("aqi_descriptions.good"),
            advice: i18n.t("advice.good")
        },
        2: {
            description: i18n.t("aqi_descriptions.fair"),
            advice: i18n.t("advice.fair")
        },
        3: {
            description: i18n.t("aqi_descriptions.moderate"),
            advice: i18n.t("advice.moderate")
        },
        4: {
            description: i18n.t("aqi_descriptions.poor"),
            advice: i18n.t("advice.poor")
        },
        5: {
            description: i18n.t("aqi_descriptions.very_poor"),
            advice: i18n.t("advice.very_poor")
        }
    };

    // Get base advice based on AQI level
    const baseDetails = levels[Math.ceil(aqi / 20)] || {
        description: i18n.t("aqi_descriptions.unknown"),
        advice: i18n.t("advice.unknown")
    };

    // Add pollutant-specific advice
    let additionalAdvice = "";
    if (components.pm2_5 > 35) {
        additionalAdvice += i18n.t("health.advice.high_pm2_5");
    }
    if (components.o3 > 100) {
        additionalAdvice += i18n.t("health.advice.high_o3");
    }

    return {
        description: baseDetails.description,
        advice: baseDetails.advice + " " + additionalAdvice.trim()
    };
};

module.exports = { getAllData };
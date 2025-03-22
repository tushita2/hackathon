const axios = require("axios");

const cache = {}; // Cache for city coordinates

const getCoordinates = async (city, API_KEY) => {
    console.log("Using OpenCage API Key:", API_KEY); // Debug API Key

    if (!API_KEY) {
        console.error("API Key is missing. Please check your .env file.");
        return null;
    }

    if (cache[city]) {
        console.log(`Cache hit for city: ${city}`);
        return cache[city];
    }

    try {
        console.log(`Fetching coordinates for city: ${city}`);
        const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}&limit=5`;
        const response = await axios.get(geocodeUrl);

        const results = response.data.results || [];
        if (results.length === 0) {
            console.error(`No valid results found for city: ${city}`);
            return null;
        }

        // Filter results for India and pick the highest-confidence match
        const resultsInIndia = results.filter(result => result.components.country_code === 'in');
        const bestResult = resultsInIndia.sort((a, b) => b.confidence - a.confidence)[0];

        if (!bestResult) {
            console.error(`No suitable results found for city: ${city} in India`);
            return null;
        }

        const { lat, lng } = bestResult.geometry;
        const coordinates = { lat, lon: lng };
        console.log(`Best match for ${city}:`, bestResult.formatted, `(${lat}, ${lng})`);

        cache[city] = coordinates; // Cache results
        return coordinates;
    } catch (error) {
        console.error(`Error fetching coordinates for city ${city}:`, error.message);
        return null;
    }
};

module.exports = getCoordinates;
const mongoose = require('mongoose');

const pollutionDataSchema = new mongoose.Schema({
    city: String,
    coordinates: { lat: Number, lon: Number },
    data: Object,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PollutionData', pollutionDataSchema);

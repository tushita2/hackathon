const express = require("express");
const router = express.Router();
const { getAllData } = require("../controllers/pollutionController");

// API Endpoints
router.get("/pollution/all-data", getAllData);

module.exports = router;

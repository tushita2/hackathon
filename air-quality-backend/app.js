require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const cors = require("cors");
const pollutionRoutes = require("./routes/pollutionRoutes");
//package that restarts server automatically: nodemon --save-dev
const app = express();
app.use(cors());
app.use("/api", pollutionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

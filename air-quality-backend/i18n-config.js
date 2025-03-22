const i18n = require("i18next");
const Backend = require("i18next-fs-backend");
const path = require("path");

i18n.use(Backend).init({
    lng: "en",
    fallbackLng: "en",
    preload: ["en", "hi"],
    backend: {
        loadPath: path.join(__dirname, "locales/{{lng}}/translation.json")
    },
    interpolation: {
        escapeValue: false
    },
    debug: true // Turn off in production
});

module.exports = i18n;

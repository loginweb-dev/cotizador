const webpush = require("web-push");
const { PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY } = process.env;

webpush.setVapidDetails(
  "mailto:info@hondaprada.com.bo",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

module.exports = webpush;
// Vercel serverless entry point.
// All /api/* requests are rewritten here via vercel.json.
// The Express app in server/app.js handles the actual routing.
module.exports = require("../server/app");

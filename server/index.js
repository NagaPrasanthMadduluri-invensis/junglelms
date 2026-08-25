const app = require("./app");

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`\n  bechtel assessment API   http://localhost:${PORT}/api/health\n`);
});

const { join } = require('path');

// Keep Chrome inside the project. Render only ships the project folder to the
// running server, so a browser downloaded into ~/.cache is missing at runtime.
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

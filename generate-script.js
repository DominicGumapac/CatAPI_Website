const fs = require('fs');
fs.writeFileSync(
  'config.js',
  `const CAT_API_KEY = "${process.env.CAT_API_KEY}";`
);
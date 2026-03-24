const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(/transtone/g, 'translate');

fs.writeFileSync(appPath, content);
console.log('Fixed transtone typo!');

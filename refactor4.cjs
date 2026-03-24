const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Fix the confetti syntax error
// The previous replacement was: content = content.replace(/confetti\(\{/g, '// confetti({');
// This left the object properties dangling.
// I will just replace the whole block or comment out the properties.
// Let's just remove the // confetti({ and replace the whole block.
// Actually, it's easier to just undo the previous replacement and then replace the whole block.
content = content.replace(/\/\/ confetti\(\{/g, '/* confetti({');
content = content.replace(/colors: \['#10b981', '#34d399', '#6ee7b7'\]\n      \}\);/g, "colors: ['#10b981', '#34d399', '#6ee7b7']\n      }); */");

fs.writeFileSync(appPath, content);
console.log('Fixed confetti syntax error!');

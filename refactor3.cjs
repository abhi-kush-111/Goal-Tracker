const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(/Crushed Today/g, 'Protocols Completed');
content = content.replace(/crushedExpanded/g, 'completedExpanded');
content = content.replace(/setCrushedExpanded/g, 'setCompletedExpanded');

// Let's also make sure the "Crushed it!" replacement worked.
content = content.replace(/"Crushed it!"/g, '"Protocol Complete."');

// Let's look for any "confetti" and maybe disable it or make it more subtle?
// The user said "No more big green buttons or colorful confetti."
// I should remove the confetti call or replace it with a subtle flash.
content = content.replace(/confetti\(\{/g, '// confetti({');

fs.writeFileSync(appPath, content);
console.log('App.tsx refactored for executive copywriting and no confetti!');

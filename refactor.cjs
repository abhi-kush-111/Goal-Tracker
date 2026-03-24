const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Replace colors for Matte Ceramic White / Warm Titanium
content = content.replace(/#111827/g, '#2A2A28'); // Dark card bg
content = content.replace(/#0c1020/g, '#242422'); // Dark app bg
content = content.replace(/#052e1a/g, '#431407'); // Dark text on accent
content = content.replace(/slate-/g, 'stone-'); // Warmer grays
content = content.replace(/emerald-/g, 'orange-'); // Safety orange accent

// Make cards neumorphic
// We'll replace the Card component's className
content = content.replace(
  /className=\{cn\("dark:bg-\[\#2A2A28\] bg-white border dark:border-white\/5 border-stone-200 rounded-2xl overflow-hidden", className\)\}/g,
  'className={cn("dark:bg-[#2A2A28] bg-[#F5F5F3] border dark:border-[#3D3D3B] border-[#E5E5E3] rounded-2xl overflow-hidden shadow-[8px_8px_16px_#E6E6E4,-8px_-8px_16px_#FFFFFF] dark:shadow-[8px_8px_16px_#242422,-8px_-8px_16px_#30302E]", className)}'
);

// We need to make sure the app background is #F5F5F3 in light mode
// And #2A2A28 in dark mode. This is in index.css, so we'll do that separately.

fs.writeFileSync(appPath, content);
console.log('App.tsx refactored!');

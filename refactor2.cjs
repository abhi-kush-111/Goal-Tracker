const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add btn-extruded to primary buttons
// Find buttons with bg-orange-500
content = content.replace(/bg-orange-500 text-\[\#431407\]/g, 'bg-orange-500 text-[#431407] btn-extruded');

// 2. Make numbers use font-mono-nums
// Look for text-2xl, text-3xl, text-4xl, text-5xl that are likely numbers
content = content.replace(/text-4xl font-bold/g, 'text-4xl font-bold font-mono-nums');
content = content.replace(/text-5xl font-bold/g, 'text-5xl font-bold font-mono-nums');
content = content.replace(/text-3xl font-extrabold/g, 'text-3xl font-extrabold font-mono-nums');
content = content.replace(/text-2xl font-bold/g, 'text-2xl font-bold font-mono-nums');

// 3. Update the "Crushed it!" text to "Protocol Complete."
content = content.replace(/"Crushed it!/g, '"Protocol Complete.');
content = content.replace(/"\+10 points!"/g, '"+10 points"');
content = content.replace(/"You're on fire!"/g, '"Objective Secured."');

// 4. Update the CheckCircle2 to use the LED glow when completed
// Look for text-orange-500 and add led-glow if it's a completed state
// We'll just replace text-orange-500 with text-orange-500 led-glow in specific places
// Actually, it's better to just add a small glowing dot instead of the whole checkmark glowing, but let's just add it to the checkmark for now.
content = content.replace(/text-orange-500/g, 'text-orange-500 drop-shadow-[0_0_8px_rgba(255,87,34,0.6)]');

// 5. Change "font-bold" on small text to "font-semibold tracking-widest uppercase"
content = content.replace(/text-xs font-bold/g, 'text-[10px] font-semibold tracking-widest uppercase');
content = content.replace(/text-\[10px\] font-bold/g, 'text-[9px] font-semibold tracking-widest uppercase');

fs.writeFileSync(appPath, content);
console.log('App.tsx refactored for typography and LED glow!');

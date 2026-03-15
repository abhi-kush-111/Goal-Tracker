const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const handlers = [
  'handleDeleteCategory',
  'handleDeleteGoal',
  'handleDeleteHabit',
  'handleAddMilestone',
  'handleMarkAllDone',
  'handleToggleToday',
  'handleArenaComplete'
];

handlers.forEach(handler => {
  const regex = new RegExp(`const ${handler} = \\((.*?)\\) => {`, 'g');
  app = app.replace(regex, `const ${handler} = async ($1) => {`);
});

fs.writeFileSync('src/App.tsx', app);
console.log('App.tsx handlers refactored');

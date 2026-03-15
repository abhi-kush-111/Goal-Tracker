const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. uid() -> crypto.randomUUID()
app = app.replace(/const uid = \(\) => Math\.random\(\)\.toString\(36\)\.slice\(2, 11\);/g, 'const uid = () => crypto.randomUUID();');

// 2. Make fetch functions async
app = app.replace(/const fetchGoals = \(\) => {/g, 'const fetchGoals = async () => {');
app = app.replace(/setGoals\(storage\.getGoals\(\)\);/g, 'setGoals(await storage.getGoals());');
app = app.replace(/setHabits\(storage\.getHabits\(\)\);/g, 'setHabits(await storage.getHabits());');

app = app.replace(/const fetchCategories = \(\) => {/g, 'const fetchCategories = async () => {');
app = app.replace(/const data = storage\.getCategories\(\);/g, 'const data = await storage.getCategories();');

// 3. Add await to storage calls
const storageMethods = [
  'addCategory', 'updateCategory', 'deleteCategory',
  'addGoal', 'updateGoal', 'deleteGoal',
  'addHabit', 'updateHabit', 'deleteHabit',
  'addMilestone', 'updateMilestone', 'toggleMilestone',
  'setMilestonesDone', 'deleteMilestone',
  'toggleHabit', 'toggleGoalCompletion'
];

storageMethods.forEach(method => {
  const regex = new RegExp(`storage\\.${method}`, 'g');
  app = app.replace(regex, `await storage.${method}`);
});

// 4. Add await to fetchGoals calls
app = app.replace(/fetchGoals\(\);/g, 'await fetchGoals();');

// 5. Fix useEffect to not await
app = app.replace(/useEffect\(\(\) => {\n\s+await fetchGoals\(\);\n\s+await fetchCategories\(\);/g, 'useEffect(() => {\n    fetchGoals();\n    fetchCategories();');

// 6. Fix handlers to be async
app = app.replace(/const handleAddCategory = \(e: React\.FormEvent\) => {/g, 'const handleAddCategory = async (e: React.FormEvent) => {');
app = app.replace(/const handleAddGoal = \(e: React\.FormEvent\) => {/g, 'const handleAddGoal = async (e: React.FormEvent) => {');
app = app.replace(/const handleAddHabit = \(e: React\.FormEvent\) => {/g, 'const handleAddHabit = async (e: React.FormEvent) => {');
app = app.replace(/const handleDragEnd = \(event: DragEndEvent\) => {/g, 'const handleDragEnd = async (event: DragEndEvent) => {');

// 7. Fix inline onClick handlers that now contain await
app = app.replace(/onClick={\(\) => {/g, 'onClick={async () => {');
// Some might be like: onClick={() => await storage...}
app = app.replace(/onClick={\(\) => await/g, 'onClick={async () => await');

fs.writeFileSync('src/App.tsx', app);
console.log('App.tsx refactored');

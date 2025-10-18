// Update form
const formResult = result === 'win' ? 'W' : result === 'draw' ? 'D' : 'L';
team.form.push(formResult);
if (team.form.length > 5) {
  team.form.shift(); // Keep only last 5 matches
}
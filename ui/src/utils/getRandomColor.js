const colors = [
  'primary', 'secondary', 'accent', 'positive', 'negative',
  'info', 'warning', 'purple', 'deep-purple', 'indigo', 'blue',
  'light-blue', 'cyan', 'teal', 'green', 'light-green',
  'orange', 'deep-orange', 'brown', 'blue-grey'
];

const hashCode = (str) => {
  if (!str || typeof str !== 'string') return 0; // Handle undefined, null, or non-string input

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
};

export const getRandomColor = (id) => {
  if (!id) return 'primary'; // Handle undefined or null input

  const index = Math.abs(hashCode(id)) % colors.length;
  return colors[index];
};

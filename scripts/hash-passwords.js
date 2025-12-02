// Script to generate bcrypt hashes for user passwords
// Run: node scripts/hash-passwords.js

const bcrypt = require('bcryptjs');

const users = [
  { username: 'Gohan', password: 'Gohan3322@', role: 'owner', name: 'Gohan' },
  { username: 'Aliamiri', password: 'Ali1234@', role: 'owner', name: 'Aliamiri' },
  { username: 'Jenny', password: 'Jenny123', role: 'seller', name: 'Jenny' },
];

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  const hashedUsers = await Promise.all(
    users.map(async (user) => {
      const hash = await bcrypt.hash(user.password, 10);
      return { ...user, password_hash: hash };
    })
  );

  console.log('-- Hashed passwords for migration:\n');
  console.log('INSERT INTO users (username, password_hash, role, name) VALUES');
  
  hashedUsers.forEach((user, index) => {
    const comma = index < hashedUsers.length - 1 ? ',' : '';
    console.log(`  ('${user.username}', '${user.password_hash}', '${user.role}', '${user.name}')${comma}`);
  });
  
  console.log('ON CONFLICT (username) DO NOTHING;\n');
  
  console.log('Copy the INSERT statement above and use it in your migration file.');
}

generateHashes().catch(console.error);


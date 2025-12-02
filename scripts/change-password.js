// Script to generate a bcrypt hash for a new password
// Usage: node scripts/change-password.js <username> <new-password>
// Example: node scripts/change-password.js Gohan MyNewPassword123@

const bcrypt = require('bcryptjs');

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('Usage: node scripts/change-password.js <username> <new-password>');
  console.error('Example: node scripts/change-password.js Gohan MyNewPassword123@');
  process.exit(1);
}

async function generateHash() {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    
    console.log('\n✅ Password hash generated successfully!\n');
    console.log('-- SQL UPDATE statement:\n');
    console.log(`UPDATE users`);
    console.log(`SET password_hash = '${hash}'`);
    console.log(`WHERE username = '${username}';`);
    console.log('\n-- Copy and run the above SQL in your Supabase SQL Editor\n');
    
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

generateHash();


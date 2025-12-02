# 🔐 How to Change User Passwords

## Quick Steps

### 1. Generate a Hash for the New Password

Run this command in your terminal:

```bash
npm run change-password <username> <new-password>
```

**Examples:**
```bash
# Change Gohan's password
npm run change-password Gohan MyNewSecurePassword123@

# Change Jenny's password
npm run change-password Jenny NewJennyPass456!

# Change Aliamiri's password
npm run change-password Aliamiri SecureAliPass789@
```

### 2. Copy the Generated SQL

The script will output an SQL UPDATE statement like this:

```sql
UPDATE users
SET password_hash = '$2a$10$YOUR_GENERATED_HASH_HERE'
WHERE username = 'Gohan';
```

### 3. Run the SQL in Supabase

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Paste the generated SQL UPDATE statement
4. Click **Run** to execute

### 4. Test the New Password

Try logging in with the new password to verify it works.

---

## Example: Changing Gohan's Password

**Step 1:** Run the command
```bash
npm run change-password Gohan SuperSecure2024!
```

**Step 2:** You'll get output like:
```
✅ Password hash generated successfully!

-- SQL UPDATE statement:

UPDATE users
SET password_hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV'
WHERE username = 'Gohan';

-- Copy and run the above SQL in your Supabase SQL Editor
```

**Step 3:** Copy the SQL and run it in Supabase SQL Editor

**Step 4:** Gohan can now login with `SuperSecure2024!`

---

## Current User Credentials

- **Gohan** (owner): `Gohan3322@`
- **Aliamiri** (owner): `Ali1234@`
- **Jenny** (seller): `Jenny123`

---

## Security Notes

- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Original passwords are never stored
- ✅ Hashes cannot be reversed to get the original password
- ✅ Each password change generates a unique hash (even for the same password)

---

## Troubleshooting

**Q: The script says "command not found"**
- Make sure you're in the project root directory
- Run `npm install` first to install dependencies

**Q: The SQL update doesn't work**
- Make sure the username is spelled correctly (case-sensitive)
- Check that the user exists in the database

**Q: I forgot a password**
- You'll need to generate a new hash and update it in the database
- There's no way to recover the original password (by design, for security)


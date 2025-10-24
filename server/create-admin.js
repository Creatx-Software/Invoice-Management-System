const bcrypt = require('bcryptjs');
const db = require('./config/database');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Get username and password from command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('Usage: node create-admin.js <username> <password>');
      console.error('Example: node create-admin.js admin mypassword123');
      process.exit(1);
    }

    const [username, password] = args;

    // Validate input
    if (username.length < 3) {
      console.error('Username must be at least 3 characters long');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Password must be at least 6 characters long');
      process.exit(1);
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, `${username}@company.com`]
    );

    if (existingUsers.length > 0) {
      console.error(`User with username '${username}' already exists`);
      process.exit(1);
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new admin user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [username, `${username}@company.com`, hashedPassword, 'Administrator']
    );

    console.log(`✅ Admin user created successfully!`);
    console.log(`📊 User ID: ${result.insertId}`);
    console.log(`👤 Username: ${username}`);
    console.log(`📧 Email: ${username}@company.com`);
    console.log(`👨‍💼 Full Name: Administrator`);
    console.log(`🔒 Password: [HIDDEN - you provided it]`);

    console.log('\n🚀 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('💡 Make sure you have run the database schema first (schema.sql)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure your MySQL server is running');
    }

    process.exit(1);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the function
createAdminUser();
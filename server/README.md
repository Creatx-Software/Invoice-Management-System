# Invoice Generator Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Database Setup
1. Install MySQL on your system or use MySQL Workbench
2. Create a new database:
```sql
CREATE DATABASE invoice_generator;
USE invoice_generator;
```

3. Run the schema file to create tables:
   - Open MySQL Workbench
   - Connect to your MySQL server
   - Open the file `database/schema.sql`
   - Execute the script to create tables and insert default admin user

### 3. Environment Configuration
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your MySQL database credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=invoice_generator
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### 4. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## Default Login Credentials
- **Username**: admin
- **Password**: admin123

**Important**: Change the default password after first login in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/email and password
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout (client-side token clearing)

### Invoices
- `GET /api/invoices` - Get all invoices for authenticated user
- `GET /api/invoices/:id` - Get specific invoice with items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update existing invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Health Check
- `GET /api/health` - Server health status

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- User isolation (users can only access their own invoices)
- SQL injection protection with parameterized queries
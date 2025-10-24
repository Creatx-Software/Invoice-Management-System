# cPanel Deployment Guide
## Invoice Management System - invoice.creatxsoftware.com

This guide covers deploying both frontend (React) and backend (Node.js/Express) on the same cPanel subdomain.

---

## 📋 Prerequisites

- ✅ cPanel with Node.js support
- ✅ FTP access configured
- ✅ MySQL database set up in cPanel
- ✅ Subdomain: `invoice.creatxsoftware.com` pointing to `/home/username/invoice.creatxsoftware.com/`

---

## 🚀 Deployment Steps

### Step 1: Build React Frontend Locally

On your local machine, build the production version of the React app:

```bash
cd client
npm install
npm run build
```

This creates an optimized production build in `client/build/` folder.

---

### Step 2: Prepare Files for Upload

You need to upload these folders/files to cPanel via FTP:

```
/home/username/invoice.creatxsoftware.com/
├── server/                    # Upload entire server folder
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env                   # Create this file (see Step 3)
│
└── client/
    └── build/                 # Upload only the build folder from client
        ├── static/
        ├── index.html
        └── ...
```

**Important:**
- Upload the entire `server/` folder
- From `client/`, upload ONLY the `build/` folder (not the entire client folder)
- Do NOT upload `node_modules/` folders

---

### Step 3: Create Production Environment File

In cPanel File Manager, navigate to:
```
/home/username/invoice.creatxsoftware.com/server/
```

Create a new file named `.env` with your production settings:

```env
# Server Configuration
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# JWT Secret (use a strong random string)
JWT_SECRET=your_production_jwt_secret_key

# Environment
NODE_ENV=production
```

**Replace the values** with your actual cPanel database credentials.

---

### Step 4: Set Up Node.js App in cPanel

1. **Log into cPanel**

2. **Find "Setup Node.js App"** (under Software section)

3. **Click "Create Application"**

4. **Configure the application:**
   - **Node.js version:** Select any available (14.x, 16.x, 18.x, or 20.x)
   - **Application mode:** `Production`
   - **Application root:** `server`
   - **Application URL:** `invoice.creatxsoftware.com`
   - **Application startup file:** `server.js`
   - **Environment variables:** Leave empty (we're using .env file)

5. **Click "Create"**

---

### Step 5: Install Dependencies

After creating the Node.js app, cPanel will show you a command to enter in the terminal.

1. **Click "Run NPM Install"** button in cPanel Node.js App interface

   OR

2. **Use cPanel Terminal:**
   ```bash
   cd /home/username/invoice.creatxsoftware.com/server
   npm install --production
   ```

---

### Step 6: Start the Application

In the cPanel Node.js App interface:

1. Click **"Start Application"** button
2. Wait for status to show "Running"

The application should now be live at: `https://invoice.creatxsoftware.com`

---

## 🧪 Testing

After deployment, test these endpoints:

1. **Frontend:**
   - Visit `https://invoice.creatxsoftware.com`
   - Should load the React login page

2. **Backend API:**
   - Visit `https://invoice.creatxsoftware.com/api/health`
   - Should return: `{"status":"Server is running"}`

3. **Login:**
   - Try logging in with your credentials
   - Should authenticate successfully

---

## 🔄 Updating Your Application

When you make changes to your code:

### For Frontend Changes:
1. Rebuild locally: `cd client && npm run build`
2. Upload new `client/build/` folder via FTP (overwrite existing)
3. **Restart Node.js app** in cPanel (important!)

### For Backend Changes:
1. Upload modified files in `server/` folder via FTP
2. **Restart Node.js app** in cPanel:
   - Go to "Setup Node.js App"
   - Click "Restart" button next to your app

---

## 🛠️ Troubleshooting

### App won't start:
- Check error logs in cPanel Node.js App interface
- Verify `.env` file exists and has correct values
- Ensure `npm install` completed successfully
- Check that `client/build/` folder exists

### Database connection errors:
- Verify database credentials in `.env`
- Ensure database user has correct permissions
- Check that `DB_HOST=localhost` (for cPanel)

### 404 errors:
- Restart the Node.js application
- Check that `client/build/` folder is in the correct location
- Verify `NODE_ENV=production` in `.env`

### Frontend shows but API doesn't work:
- Check `.env.production` in client has `REACT_APP_API_BASE_URL=` (empty)
- Restart the Node.js app
- Check API endpoint directly: `/api/health`

### Changes not reflecting:
- Always restart the Node.js app after uploading new files
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check that you uploaded to correct folder

---

## 📁 Folder Structure on cPanel

```
/home/username/invoice.creatxsoftware.com/
│
├── server/                          # Backend (Node.js/Express)
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── invoices.js
│   ├── node_modules/                # Created by npm install
│   ├── .env                         # Your production config
│   ├── server.js                    # Entry point
│   └── package.json
│
└── client/
    └── build/                       # React production build
        ├── static/
        │   ├── css/
        │   └── js/
        ├── index.html
        ├── favicon.ico
        └── asset-manifest.json
```

---

## 🔒 Security Notes

- Never commit `.env` file to Git
- Use strong JWT secret (random 32+ character string)
- Keep database credentials secure
- Regularly update dependencies for security patches

---

## ✅ Quick Reference Commands

**Local Build:**
```bash
cd client
npm run build
```

**cPanel Terminal (if needed):**
```bash
cd /home/username/invoice.creatxsoftware.com/server
npm install --production
```

**Restart App:**
- cPanel → Setup Node.js App → Restart button

---

## 📞 Support

If you encounter issues:
1. Check cPanel Node.js App error logs
2. Verify database connection in phpMyAdmin
3. Test API endpoint: `/api/health`
4. Contact your hosting provider for Node.js specific issues

---

**Your application is now live at:** `https://invoice.creatxsoftware.com`

Both frontend and backend are served from the same domain on the same server! 🎉

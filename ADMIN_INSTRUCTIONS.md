# 🔐 Admin Setup Instructions

## Step 1: Set Your Super Admin Email

1. Open `src/admin/adminUtils.js`
2. Find line 5: `const SUPER_ADMIN_EMAIL = "youremail@gmail.com";`
3. **Replace** `youremail@gmail.com` with **YOUR actual email**
   ```javascript
   const SUPER_ADMIN_EMAIL = "yourname@gmail.com"; // Your email here!
   ```

## Step 2: Create Your Account

1. Go to your website homepage
2. Click "Sign Up" or "Log In"
3. Create an account using **the same email** you set as SUPER_ADMIN_EMAIL
4. Use Google Sign-In or Email/Password - either works!

## Step 3: Access Admin Panel

1. Go to: `http://localhost:5173/admin` (or `yourwebsite.com/admin`)
2. Login with your super admin account
3. You'll see the admin dashboard!

## Step 4: Add Other Admins (Optional)

1. In the dashboard, click the **"Manage Admins"** tab
2. Enter another user's email address
3. Click "Add Admin"
4. That person can now access `/admin` too!

---

## ✅ That's It!

**You are the Super Admin** - you can:
- ✅ Access the admin dashboard
- ✅ Add other admins
- ✅ Remove admins
- ✅ Manage the system

**Other admins** you add can:
- ✅ Access the dashboard
- ❌ Cannot add/remove other admins (only you can)

---

## 🔒 Security Notes

- Your super admin email is hard-coded (secure)
- Other admins are stored in Firestore database
- All admin access is protected by Firebase Authentication
- No one can become admin without your permission

---

## 🆘 Troubleshooting

**"Access Denied" error?**
- Make sure you set your email correctly in `adminUtils.js`
- Make sure you created an account with that exact email
- Try logging out and back in

**Can't add other admins?**
- Only the super admin (you) can add admins
- Make sure you're logged in with your super admin account
- Check that the email is valid

---

**Need help? Check the console for errors or contact support!**

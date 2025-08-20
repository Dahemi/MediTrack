# MediTrack - Patient Registration & Email Verification System

A complete MERN stack application with TypeScript for healthcare patient registration and email verification.

## 🚀 Features

- **Patient Registration** with form validation
- **Email Verification** with secure tokens
- **Login System** with verification checks
- **Responsive Design** with TailwindCSS
- **Type Safety** with TypeScript
- **Email Service** with Nodemailer
- **MongoDB Integration** with Mongoose

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- bcryptjs (password hashing)
- Nodemailer (email service)
- crypto (token generation)

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Formik + Yup (forms & validation)
- Axios (API calls)
- React Router

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Gmail account (for email service)

## ⚙️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm run install:all
```

### 2. Backend Configuration

Create `backend/.env` file:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/meditrack

# Server Configuration
PORT=5000

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
BASE_URL=http://localhost:5000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail Setup for Email Service

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### 4. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new patient |
| GET | `/verify/:token` | Verify email with token |
| POST | `/login` | Login patient |
| POST | `/resend-verification` | Resend verification email |

### Example API Usage

```javascript
// Register Patient
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Verify Email
GET /api/auth/verify/abc123token

// Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

## 📁 Project Structure

```
meditrack/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── mailer.ts
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── models/
│   │   │   └── Patient.ts
│   │   ├── routes/
│   │   │   └── authRoutes.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Register.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Verify.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
└── package.json
```

## 🎯 User Flow

1. **Registration**: User fills form → Backend validates → Sends verification email
2. **Email Verification**: User clicks email link → Backend verifies token → Account activated
3. **Login**: User enters credentials → Backend checks verification status → Login success

## 🔒 Security Features

- Password hashing with bcryptjs (12 salt rounds)
- Secure token generation with crypto
- Email verification required before login
- Input validation and sanitization
- CORS protection
- Error handling without sensitive data exposure

## 🧪 Testing the System

1. **Register**: Go to `/register` and create an account
2. **Check Email**: Look for verification email in inbox
3. **Verify**: Click the verification link
4. **Login**: Use `/login` with verified credentials

## 🚨 Troubleshooting

### Email Not Sending
- Check Gmail app password is correct
- Verify 2FA is enabled on Gmail
- Check console for email service errors

### MongoDB Connection Issues
- Ensure MongoDB is running locally
- Check connection string in `.env`
- Verify database permissions

### CORS Issues
- Check frontend URL in backend CORS config
- Ensure ports match (5173 for frontend, 5000 for backend)

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/meditrack` |
| `PORT` | Backend server port | `5000` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app password | `abcd efgh ijkl mnop` |
| `BASE_URL` | Backend base URL | `http://localhost:5000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🎨 UI Features

- Responsive design for all screen sizes
- Loading states and animations
- Form validation with real-time feedback
- Success/error message handling
- Modern gradient backgrounds
- Accessible form controls

## 🔄 Next Steps

- Add password reset functionality
- Implement JWT-based authentication
- Add user dashboard
- Integrate appointment booking
- Add admin panel
- Implement role-based access control

## 📄 License

This project is licensed under the MIT License.
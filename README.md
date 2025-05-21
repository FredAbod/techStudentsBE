# Class-Spark-Achieve-Certify Educational Platform

A comprehensive backend system for managing students, tutors, assignments, and attendance in an educational setting.

## Tech Stack

- **Node.js** with Express.js for API framework
- **MongoDB** with Mongoose ODM for database
- **JWT** for authentication
- **Cloudinary** for file storage
- **Multer** for handling file uploads
- **Nodemailer** for email notifications
- Comprehensive error handling and validation

## Features

- User authentication (signup, login, password reset)
- Role-based access control (student and tutor roles)
- Student management with auto-generated serial numbers
- Assignment submission and grading
- Attendance tracking
- File uploads for assignments and profile avatars
- CSV import for bulk student creation

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register a new user (student or tutor)
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user data
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

### Profiles

- `GET /api/v1/profiles/:id` - Get profile by ID
- `PATCH /api/v1/profiles/:id` - Update profile
- `GET /api/v1/profiles` - Get all profiles (tutor only)

### Students

- `GET /api/v1/students` - Get all students (tutor only)
- `GET /api/v1/students/:id` - Get student by ID
- `GET /api/v1/students/me` - Get current student's record
- `PATCH /api/v1/students/:id` - Update student data
- `POST /api/v1/students/import` - Bulk import students from CSV (tutor only)

### Assignments

- `POST /api/v1/assignments` - Submit new assignment (file upload)
- `GET /api/v1/assignments` - Get all assignments (filtered by student for student role)
- `PATCH /api/v1/assignments/:id` - Update assignment (for grading by tutor)
- `GET /api/v1/assignments/:id` - Get specific assignment

### Attendance

- `POST /api/v1/attendance` - Mark attendance (tutor only)
- `GET /api/v1/attendance` - Get attendance records (filter by student, date)
- `DELETE /api/v1/attendance/:id` - Remove attendance record (tutor only)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set environment variables in `.env` file
4. Run the server: `npm start` or `npm run dev` for development mode

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5600
MONGO_URI=mongodb://localhost:27017/class-spark
JWT_SECRET=your_jwt_secret_here

EMAIL_NODEMAILER=your_email@gmail.com
PASSWORD_NODEMAILER=your_email_password

CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_EMAIL=admin@example.com
```

## License

ISC

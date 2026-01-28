# Elite Properties Backend API

Elite Properties is a comprehensive real estate management platform that allows users to post property listings, manage profiles, and browse properties with advanced search and filtering capabilities.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Profile Management](#profile-management)
  - [Property Management](#property-management)
  - [Admin Management](#admin-management)
- [API Usage Examples](#api-usage-examples)
- [Response Formats](#response-formats)

## Features

- **User Authentication**: Secure JWT-based authentication with email verification
- **Property Management**: Complete property listing system with pictures and videos
- **Profile Management**: User profiles with personal and contact information
- **Advanced Search**: Filter properties by type, category, location, price, and more
- **Media Upload**: AWS S3 integration for property pictures and videos
- **Role-based Access**: Different permissions for regular users and administrators
- **Email Notifications**: OTP-based email verification using Resend

## Tech Stack

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token for authentication
- **Multer**: File upload middleware
- **AWS SDK**: Integration with Amazon S3 for media storage
- **Resend**: Email service for OTP notifications
- **Bcrypt.js**: Password hashing
- **Cors**: Cross-origin resource sharing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Elite-properties-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the required environment variables (see below)

4. Start the development server:
```bash
npm run dev
```

5. The server will start on `http://localhost:8000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_s3_bucket_name
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin_password"
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@example.com
```

## API Endpoints

### Authentication

#### Signup
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNo": "9876543210",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email using the OTP sent to your email address.",
  "userId": "user_id",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNo": "9876543210"
  },
  "profile": {
    "id": "profile_id",
    "authId": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNo": "9876543210"
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNo": "9876543210",
    "role": "client"
  }
}
```

#### Verify Email OTP
```http
POST /api/auth/verify-email-otp
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Profile Management

#### Get Profile
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "profile_id",
    "authId": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNo": "9876543210",
    "phoneNo2": "9876543211",
    "panNo": "ABCDE1234F",
    "adharNo": "123456789012",
    "address": {
      "addressLine": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Profile
```http
PUT /api/profile
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "fullName": "John Smith",
  "phoneNo2": "9876543211",
  "adharNo": "123456789012",
  "panNo": "ABCDE1234F",
  "address": {
    "addressLine": "456 Park Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "profile_id",
    "authId": "user_id",
    "fullName": "John Smith",
    "email": "john@example.com",
    "phoneNo": "9876543210",
    "phoneNo2": "9876543211",
    "panNo": "ABCDE1234F",
    "adharNo": "123456789012",
    "address": {
      "addressLine": "456 Park Street",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Property Management

#### Create Property Post
```http
POST /api/property/posts
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "propertyType": "owner",
  "priceTag": "₹50 Lac",
  "price": 5000000,
  "propertyDetails": "Beautiful 2 BHK apartment in prime location",
  "contactInfo": "9876543210",
  "isFurnished": true,
  "hasParking": true,
  "propertyCategory": "sale",
  "bhk": 2,
  "floor": 3,
  "propertyAge": 5,
  "facing": "east",
  "buildArea": 1200,
  "carpetArea": 900,
  "locality": "Andheri West",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400058",
  "landmark": "Near Metro Station",
  "amenities": ["Gym", "Swimming Pool", "Club House"],
  "nearbyPlaces": ["School", "Hospital", "Market"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property post created successfully",
  "propertyPost": {
    "_id": "property_id",
    "userId": "user_id",
    "propertyType": "owner",
    "priceTag": "₹50 Lac",
    "price": 5000000,
    "propertyDetails": "Beautiful 2 BHK apartment in prime location",
    "propertyPics": [],
    "propertyVideos": [],
    "contactInfo": "9876543210",
    "isFurnished": true,
    "hasParking": true,
    "propertyCategory": "sale",
    "bhk": 2,
    "floor": 3,
    "propertyAge": 5,
    "facing": "east",
    "buildArea": 1200,
    "carpetArea": 900,
    "locality": "Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400058",
    "landmark": "Near Metro Station",
    "amenities": ["Gym", "Swimming Pool", "Club House"],
    "nearbyPlaces": ["School", "Hospital", "Market"],
    "propertyStatus": "available",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Property Posts
```http
GET /api/property/posts?page=1&limit=10&city=Mumbai&propertyCategory=sale
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `propertyType`: Filter by property type (owner/lease)
- `propertyCategory`: Filter by category (rental/sale/commercial_sale/pg/hostel/flatmates/land/plot)
- `city`: Filter by city
- `state`: Filter by state
- `bhk`: Filter by BHK count
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `isFurnished`: Filter by furnished status (true/false)
- `hasParking`: Filter by parking availability (true/false)
- `facing`: Filter by facing direction

**Response:**
```json
{
  "success": true,
  "propertyPosts": [
    {
      "_id": "property_id",
      "userId": {
        "_id": "user_id",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNo": "9876543210"
      },
      "propertyType": "owner",
      "priceTag": "₹50 Lac",
      "price": 5000000,
      "propertyDetails": "Beautiful 2 BHK apartment",
      "propertyPics": ["https://s3.amazonaws.com/bucket/image1.jpg"],
      "propertyVideos": ["https://s3.amazonaws.com/bucket/video1.mp4"],
      "contactInfo": "9876543210",
      "isFurnished": true,
      "hasParking": true,
      "propertyCategory": "sale",
      "bhk": 2,
      "floor": 3,
      "propertyAge": 5,
      "facing": "east",
      "buildArea": 1200,
      "carpetArea": 900,
      "locality": "Andheri West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400058",
      "landmark": "Near Metro Station",
      "amenities": ["Gym", "Swimming Pool"],
      "nearbyPlaces": ["School", "Hospital"],
      "propertyStatus": "available",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProperties": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Get Property Post by ID
```http
GET /api/property/posts/:id
```

**Response:**
```json
{
  "success": true,
  "propertyPost": {
    "_id": "property_id",
    "userId": {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNo": "9876543210"
    },
    // ... all property details
  }
}
```

#### Get My Property Posts
```http
GET /api/property/posts/user/my-posts
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "propertyPosts": [
    // Array of user's property posts
  ]
}
```

#### Update Property Post
```http
PUT /api/property/posts/:id
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "price": 4500000,
  "propertyDetails": "Updated property description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property post updated successfully",
  "propertyPost": {
    // Updated property post object
  }
}
```

#### Delete Property Post
```http
DELETE /api/property/posts/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Property post deleted successfully"
}
```

#### Upload Property Pictures
```http
POST /api/property/upload/pictures/:property_id
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `pictures`: Array of image files (max 10 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "message": "3 picture(s) uploaded successfully",
  "pictures": [
    "https://s3.amazonaws.com/bucket/image1.jpg",
    "https://s3.amazonaws.com/bucket/image2.jpg",
    "https://s3.amazonaws.com/bucket/image3.jpg"
  ]
}
```

#### Upload Property Videos
```http
POST /api/property/upload/videos/:property_id
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `videos`: Array of video files (max 5 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "message": "2 video(s) uploaded successfully",
  "videos": [
    "https://s3.amazonaws.com/bucket/video1.mp4",
    "https://s3.amazonaws.com/bucket/video2.mp4"
  ]
}
```

#### Delete Property Picture
```http
DELETE /api/property/pictures/:property_id
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "pictureUrl": "https://s3.amazonaws.com/bucket/image1.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Picture deleted successfully"
}
```

#### Delete Property Video
```http
DELETE /api/property/videos/:property_id
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "videoUrl": "https://s3.amazonaws.com/bucket/video1.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

#### Get Property Statistics
```http
GET /api/property/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalProperties": 150,
    "activeProperties": 120,
    "soldProperties": 20,
    "rentedProperties": 10,
    "propertiesByCategory": [
      { "_id": "sale", "count": 80 },
      { "_id": "rental", "count": 40 },
      { "_id": "pg", "count": 20 },
      { "_id": "land", "count": 10 }
    ],
    "propertiesByCity": [
      { "_id": "Mumbai", "count": 60 },
      { "_id": "Delhi", "count": 40 },
      { "_id": "Bangalore", "count": 30 },
      { "_id": "Chennai", "count": 20 }
    ]
  }
}
```

### Admin Management

#### Admin Login
Admin uses the same login endpoint as regular users but with ADMIN_EMAIL and ADMIN_PASSWORD from environment variables:

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@eliteassociate.in",
  "password": "elite@crm25"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "jwt_admin_token",
  "user": {
    "id": "admin_id",
    "fullName": "Admin User",
    "email": "admin@eliteassociate.in",
    "phoneNo": "0000000000",
    "role": "admin"
  }
}
```

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNo": "9876543210",
      "role": "client",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get User by ID
```http
GET /api/admin/users/:id
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNo": "9876543210",
    "role": "client",
    "profile": {
      "_id": "profile_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNo": "9876543210",
      "address": {
        "addressLine": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      }
    }
  }
}
```

#### Delete User
Deletes user and all associated data including properties and media files:

```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User and all associated data deleted successfully"
}
```

#### Get All Properties (Admin View)
```http
GET /api/admin/properties?page=1&limit=10&isActive=true
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `propertyType`: Filter by property type
- `propertyCategory`: Filter by category
- `city`: Filter by city
- `state`: Filter by state
- `bhk`: Filter by BHK count
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `isFurnished`: Filter by furnished status
- `hasParking`: Filter by parking availability
- `facing`: Filter by facing direction
- `isActive`: Filter by active status

**Response:**
```json
{
  "success": true,
  "propertyPosts": [
    {
      "_id": "property_id",
      "userId": {
        "_id": "user_id",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNo": "9876543210"
      },
      "propertyType": "owner",
      "price": 5000000,
      "propertyCategory": "sale",
      "city": "Mumbai",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProperties": 45,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Delete Property (Admin)
Deletes property and all associated media files from S3:

```http
DELETE /api/admin/properties/:id
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Property post and all associated media deleted successfully"
}
```

#### Update Property Status
```http
PUT /api/admin/properties/:id/status
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "propertyStatus": "sold"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property status updated successfully",
  "propertyPost": {
    // Updated property post object
  }
}
```

#### Get Admin Dashboard Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalProperties": 200,
    "activeProperties": 180,
    "inactiveProperties": 20,
    "propertiesByCategory": [
      { "_id": "sale", "count": 100 },
      { "_id": "rental", "count": 60 },
      { "_id": "pg", "count": 40 }
    ],
    "propertiesByCity": [
      { "_id": "Mumbai", "count": 80 },
      { "_id": "Delhi", "count": 60 },
      { "_id": "Bangalore", "count": 40 }
    ],
    "usersByCity": [
      { "_id": "Mumbai", "count": 60 },
      { "_id": "Delhi", "count": 50 },
      { "_id": "Bangalore", "count": 40 }
    ]
  }
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Authentication Headers

For protected routes, include the JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## File Upload Limits

- **Pictures**: Max 10 files, 10MB each
- **Videos**: Max 5 files, 10MB each
- **Supported Image Formats**: JPEG, PNG, GIF, WEBP
- **Supported Video Formats**: MP4, MOV, AVI, WMV

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per hour per IP for general endpoints
- 10 requests per hour for authentication endpoints

## Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Support

For support and inquiries, please contact the development team or check the documentation.
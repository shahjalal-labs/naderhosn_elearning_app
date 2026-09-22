# Manual User Signup (Apple Submission Guide)

This document provides complete instructions for the frontend team to integrate the **Manual Student & Teacher Signup Flow** built specifically for Apple App Store Review compliance.

---

## 📌 Overview & Architecture

* **Target Users:** Both **Students** and **Teachers** can sign up.
* **Storage & Safety:** Registrations are held in a temporary `pending_users` collection until the 4-digit OTP is verified. Once verified, they are permanently created in the `users` table with `isManualSignup: true`.
* **Password:** Passwords are kept unhashed (plain-text) to match the existing system architecture.
* **Auto-generated Username:** The frontend does **not** provide a username. The backend automatically generates a guaranteed unique `loginUserName`:
  * **Students:** `s` + 5 random digits (e.g., `s48291`)
  * **Teachers:** `teach` + 5 random digits (e.g., `teach59102`)
  * This username is returned in the verification response and can be displayed on a "Welcome" or "Registration Successful" screen.
* **Login Flexibility:** Users can log in using **either** their auto-generated `userName` **or** their `email` with the existing login endpoint (`POST /api/v1/auth/login`).

---

## 🔄 User Journey & UI Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Teacher
    participant UI as Frontend App
    participant API as Backend API
    participant Mail as User's Email

    UI->>User: Display Registration Form
    User->>UI: Fills Form (Name, Email, Password, Role, Image) & Clicks "Sign Up"
    UI->>API: POST /api/v1/auth/signup (multipart/form-data)
    API->>Mail: Sends 4-digit OTP (expires in 5 minutes)
    API-->>UI: 200 OK ("OTP sent to your email")

    UI->>User: Display OTP Verification Modal / Screen
    User->>UI: Enters 4-digit OTP
    UI->>API: POST /api/v1/auth/verify-signup-otp { email, otp }
    API-->>UI: 200 OK (Returns auto-generated username & JWT accessToken)

    Note over UI, User: Option A: Auto-login immediately using the returned accessToken.<br/>Option B: Display success screen with assigned username, then redirect to login.
```

---

## 📡 API Endpoints Specification

### Base URLs
- **Production:** `https://api.darelchimalapp.com/api/v1`
- **Development:** `http://10.0.20.221:5555/api/v1` (or local port)

---

### Step 1: Submit Registration Details & Send OTP

Initiates the registration, uploads profile image to DigitalOcean Spaces, stores data in `pending_users`, and emails a 4-digit OTP.

* **Method:** `POST`
* **Endpoint:** `/auth/signup`
* **Content-Type:** `multipart/form-data` (or `application/json` if no image file is being uploaded)

#### Request Fields:

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | **Yes** | Valid email address | `"reviewer@apple.com"` |
| `password` | String | **Yes** | User password | `"reviewPass123"` |
| `role` | String | No | Role of user: `"Student"` or `"Teacher"` (Default: `"Student"`) | `"Student"` |
| `fullName` | String | No | Full display name | `"John Doe"` |
| `gender` | String | No | `"Male"` or `"Female"` | `"Male"` |
| `phone` | String | No | Phone number | `"+96170123456"` |
| `DOB` | String | No | Date of birth (ISO 8601 string) | `"2000-01-15"` |
| `profileImage` | File (Binary) | No | Avatar/photo (JPEG, PNG, WEBP) | `avatar.png` |

#### Request Example (JSON - when no file is uploaded):
```json
{
  "fullName": "Jane Student",
  "email": "jane.student@example.com",
  "password": "MySecretPassword123",
  "role": "Student",
  "gender": "Female",
  "phone": "+96170112233",
  "DOB": "2005-06-20"
}
```

#### Request Example (Multipart Form-Data - JavaScript / React Native / Web):
```javascript
const formData = new FormData();
formData.append("fullName", "Jane Student");
formData.append("email", "jane.student@example.com");
formData.append("password", "MySecretPassword123");
formData.append("role", "Student");
formData.append("gender", "Female");
formData.append("phone", "+96170112233");
formData.append("DOB", "2005-06-20");

if (imageFile) {
  formData.append("profileImage", imageFile); // file object or { uri, name, type } on React Native
}

const response = await fetch("https://api.darelchimalapp.com/api/v1/auth/signup", {
  method: "POST",
  body: formData,
});
```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "data": {
    "email": "jane.student@example.com"
  }
}
```

#### Error Responses:
* **`400 Bad Request`:**
  ```json
  {
    "statusCode": 400,
    "success": false,
    "message": "Email is required" // or "Password is required"
  }
  ```
* **`409 Conflict`:**
  ```json
  {
    "statusCode": 409,
    "success": false,
    "message": "User with this email already exists"
  }
  ```

---

### Step 2: Verify OTP & Activate Account

Validates the OTP code, auto-generates the username, moves user to permanent storage, and returns user credentials.

* **Method:** `POST`
* **Endpoint:** `/auth/verify-signup-otp`
* **Content-Type:** `application/json`

#### Request Body:
```json
{
  "email": "jane.student@example.com",
  "otp": "4819"
}
```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User verified and registered successfully.",
  "data": {
    "userName": "s48291",
    "email": "jane.student@example.com",
    "fullName": "Jane Student",
    "role": "Student",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> 💡 **Frontend Recommendation:**
> 1. You can immediately store `data.accessToken` and log the user into the app without prompting them to log in again.
> 2. Display `data.userName` (e.g. `s48291`) so the user knows their login username for future sessions.

#### Error Responses:
* **`400 Bad Request`:**
  ```json
  {
    "statusCode": 400,
    "success": false,
    "message": "No pending registration found for this email."
  }
  ```
* **`401 Unauthorized`:**
  ```json
  {
    "statusCode": 401,
    "success": false,
    "message": "Invalid OTP."
  }
  ```
* **`410 Gone` (OTP Expired):**
  ```json
  {
    "statusCode": 410,
    "success": false,
    "message": "OTP has expired. Please sign up again."
  }
  ```

---

### Step 3: Subsequent User Login

Manual signup users can log in via the standard login endpoint using **either** their auto-generated `userName` or their `email`.

* **Method:** `POST`
* **Endpoint:** `/auth/login`
* **Content-Type:** `application/json`

#### Request Body (Option A - Using Auto-generated Username):
```json
{
  "userName": "s48291",
  "password": "MySecretPassword123",
  "fcmToken": "optional_fcm_token"
}
```

#### Request Body (Option B - Using Email directly):
```json
{
  "userName": "jane.student@example.com",
  "password": "MySecretPassword123",
  "fcmToken": "optional_fcm_token"
}
```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User successfully logged in",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": "66f123456789abcdef012345",
    "role": "Student",
    "gradeId": null
  }
}
```

---

### Step 4: Admin Cleanup (Post Apple Review)

When the Apple review is finished, all manual signups can be purged in one call.

* **Method:** `DELETE`
* **Endpoint:** `/user/manual-signups`
* **Headers:**
  ```
  Authorization: <ADMIN_JWT_TOKEN>
  ```

#### Success Response (`200 OK`):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Manual test signups deleted successfully",
  "data": {
    "count": 5
  }
}
```

---

## 🎨 Recommended Frontend UX Checklist

- [ ] **Signup Screen:**
  - Add Role picker: "Student" (default) or "Teacher".
  - Add standard inputs: Full Name, Email, Password, Confirm Password, Gender, Phone, DOB.
  - Image picker for profile photo (optional).
- [ ] **OTP Screen / Modal:**
  - Auto-focus on 4-digit input fields.
  - Display a 5-minute countdown timer.
  - "Resend OTP" button (re-triggers `POST /auth/signup`).
- [ ] **Post-Verification Confirmation:**
  - Inform the user: *"Your account has been created! Your assigned login username is: **s48291** (You can also log in with your email)."*
  - Automatically persist the received `accessToken` into Redux/AsyncStorage.

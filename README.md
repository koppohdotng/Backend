# Backend

Certainly! Here's a formatted version of the API documentation that you can copy to your README on GitHub:

---

# [Your API Name] API Documentation

Welcome to the API documentation for [Your API Name]. This documentation provides detailed information about the endpoints and functionalities of our API.

## Authentication

Before using the API, you may need to authenticate your requests. Some endpoints require Firebase Authentication. Authentication details can be found in the specific endpoint documentation.

## Base URL

The base URL for all API endpoints is:

```
https://koppoh-41a7d984a436.herokuapp.com/
```

## Endpoints

1. **User Signup**

   - **Endpoint:** `POST /auth/signup`
   - **Description:** Register a new user account.
   - **Request Body:**
     - `firstName (string)`: User's first name.
     - `lastName (string)`: User's last name.
     - `email (string)`: User's email address.
     - `password (string)`: User's password.
   - **Response:**
     - `200 OK`: Signup successful.
     - `400 Bad Request`: Email already exists or signup failed.

2. **User Login**

   - **Endpoint:** `POST /auth/login`
   - **Description:** Log in with an existing user account.
   - **Request Body:**
     - `email (string)`: User's email address.
     - `password (string)`: User's password.
   - **Response:**
     - `200 OK`: Login successful. Returns user information.
     - `401 Unauthorized`: Incorrect password or email not found.

3. **Google Sign-In**

   - **Endpoint:** `GET /auth/google`
   - **Description:** Sign in using Google OAuth 2.0.
   - **Request Parameters:**
     - `token (string)`: Google ID token.
   - **Response:**
     - `200 OK`: Google Sign-In successful. Returns a custom token.
     - `500 Internal Server Error`: Authentication failed.

4. **Update User Data**

   - **Endpoint:** `PUT /api/update-user/:uid`
   - **Description:** Update user profile information.
   - **URL Parameters:**
     - `uid (string)`: User's unique identifier.
   - **Request Body:** (Optional)
     - `firstName (string)`: Updated first name.
     - `lastName (string)`: Updated last name.
     - `country (string)`: Updated country.
     - `phoneNumber (string)`: Updated phone number.
     - `role (string)`: Updated role.
     - `linkedIn (string)`: Updated LinkedIn profile URL.
   - **Response:**
     - `200 OK`: User information updated successfully.
     - `500 Internal Server Error`: Failed to update user information.

5. **Add Teammate**

   - **Endpoint:** `POST /api/addTeammate/:userId`
   - **Description:** Add a new teammate with an optional profile image.
   - **URL Parameters:**
     - `userId (string)`: User's unique identifier.
   - **Request Body:**
     - `name (string)`: Name of the teammate.
     - `role (string)`: Role of the teammate.
   - **Request File:**
     - `image (multipart/form-data)`: Optional profile image.
   - **Response:**
     - `200 OK`: Teammate added successfully.
     - `400 Bad Request`: Name and role are compulsory fields or error uploading the image.
     - `500 Internal Server Error`: Error adding teammate to the database.

6. **Update User Data (Extended)**

   - **Endpoint:** `PUT /updateUserData/:userId`
   - **Description:** Update extended profile information, including business details and logo.
   - **URL Parameters:**
     - `userId (string)`: User's unique identifier.
   - **Request Body:** (Various fields for updating business information)
   - **Request File:**
     - `logo (multipart/form-data)`: Updated logo image (optional).
   - **Response:**
     - `200 OK`: User data updated successfully.
     - `500 Internal Server Error`: Failed to update user data.

7. **Add Milestone**

   - **Endpoint:** `POST /addMilestone/:userId`
   - **Description:** Add a new milestone to the user's profile.
   - **URL Parameters:**
     - `userId (string)`: User's unique identifier.
   - **Request Body:**
     - `milestoneName (string)`: Name of the milestone.
     - `milestoneDescription (string)`: Description of the milestone.
     - `milestoneDate (string)`: Date of the milestone.
   - **Response:**
     - `200 OK`: New milestone added successfully.
     - `500 Internal Server Error`: Failed to add a new milestone.

8. **Send Password Reset Email**

   - **Description:** This API endpoint allows users to request a password reset link via email. It uses Firebase Authentication to generate a password reset link for the provided email address and sends the link via email.
   - **Endpoint:** `POST auth/sendPasswordResetEmail`
   - **Request Body:**
     - `email (string, required)`: The email address for which the password reset link will be sent.
   - **Response:**
     - **Success Response (HTTP 200 OK)**
       - `Content-Type: application/json`
       - `message (string)`: A success message indicating that the password reset email was sent successfully.
     - **Error Response (HTTP 400 Bad Request)**
       - `Content-Type: application/json`
       - `error (string)`: An error message indicating that the password reset email sending or link generation failed.

9. **Get User Data (Authenticated)**

   - **Endpoint:** `GET /api/user`
   - **Description:** Get authenticated user information.
   - **Authorization Header:** Firebase ID token.
   - **Response:**
     - `200 OK`: Authentication successful. Returns user information.
     - `401 Unauthorized`: Unauthorized access.
   - **Error Handling:** In case of errors, the API will return appropriate HTTP status codes and error messages. Error responses will contain a JSON object with an error field describing the error.

## Check if Email Exists

- **Base URL:** `/api`

- **Endpoint:** `/check-email`

- **HTTP Method:** `POST`

- **Description:** Checks if an email address already exists in the database.

- **Request Body:**
  - `email (string, required)`: The email address to check.

- **Responses:**
  - `200 OK:`
    - **Response Body:**
      - `message (string)`: A message indicating whether the email exists.
  - `404 Not Found:`
    - **Response Body:**
      - `message (string)`: A message indicating that the email does not exist.
  - `500 Internal Server Error:`
    - **Response Body:**
      - `message (string)`: A message indicating that an error occurred during the operation.

## Loan Request API

### Create Loan Request

- **Endpoint:** `POST /api/loanRequest`

- **Description:** Create a new loan request entry with attached documents.

- **Request Body:**
  - `date (string, required)`: Date of the request.
  - `problem

 (string, required)`: Description of the problem.
  - `solution (string, required)`: Proposed solution.
  - `stage (string, required)`: Current stage of the business.
  - `currency (string, required)`: Currency for funding.
  - `fundingAmount (number, required)`: Amount of funding requested.
  - `useOfFunds (object, required)`: Allocation of funds.
    - `product (number)`: Product development.
    - `saleAndMarketing (number)`: Sales and marketing.
    - `researchAndDevelopment (number)`: Research and development.
    - `capitalExpenditure (number)`: Capital expenditure.
    - `operation (number)`: Operational expenses.
    - `other (number)`: Other uses.
  - `financials (object)`: Financial data.
  - `files (file uploads)`: Attachments such as business plan, bank statements, etc.

- **Responses:**
  - `201 Created:`
    - **Response Body:**
      - `message (string)`: Success message.
  - `400 Bad Request:`
    - **Response Body:**
      - `error (string)`: Error message for invalid request data.
  - `500 Internal Server Error:`
    - **Response Body:**
      - `error (string)`: Error message for database-related issues.

### Retrieve User Loan Requests

- **Endpoint:** `GET /api/loanRequest/:userId`

- **Description:** Retrieve loan request data for a specific user.

- **URL Parameter:**
  - `userId (string, required)`: User identifier.

- **Responses:**
  - `200 OK:`
    - **Response Body:**
      - `userData (array of objects)`: User's loan request data.
  - `404 Not Found:`
    - **Response Body:**
      - `error (string)`: Error message when no user data is found.
  - `500 Internal Server Error:`
    - **Response Body:**
      - `error (string)`: Error message for database-related issues.

## Equity Request API

### Create Equity Request

- **Endpoint:** `POST /api/equitRequest`

- **Description:** Create a new equity request entry with attached documents.

- **Request Body:**
  - `date (string, required)`: Date of the request.
  - `problem (string, required)`: Description of the problem.
  - `solution (string, required)`: Proposed solution.
  - `stage (string, required)`: Current stage of the business.
  - `investmentStage (string, required)`: Investment stage.
  - `currency (string, required)`: Currency for funding.
  - `fundingAmount (number, required)`: Amount of funding requested.
  - `useOfFunds (object, required)`: Allocation of funds.
    - `product (number)`: Product development.
    - `saleAndMarketing (number)`: Sales and marketing.
    - `researchAndDevelopment (number)`: Research and development.
    - `capitalExpenditure (number)`: Capital expenditure.
    - `operation (number)`: Operational expenses.
    - `other (number)`: Other uses.
  - `financials (object)`: Financial data.
  - `files (file uploads)`: Attachments such as pitch decks, valuations, etc.

- **Responses:**
  - `201 Created:`
    - **Response Body:**
      - `message (string)`: Success message.
  - `400 Bad Request:`
    - **Response Body:**
      - `error (string)`: Error message for invalid request data.
  - `500 Internal Server Error:`
    - **Response Body:**
      - `error (string)`: Error message for database-related issues.

### Retrieve User Equity Requests

- **Endpoint:** `GET /api/equitRequest/:userId`

- **Description:** Retrieve equity request data for a specific user.

- **URL Parameter:**
  - `userId (string, required)`: User identifier.

- **Responses:**
  - `200 OK:`
    - **Response Body:**
      - `userData (array of objects)`: User's equity request data.
  - `404 Not Found:`
    - **Response Body:**
      - `error (string)`: Error message when no user data is found.
  - `500 Internal Server Error:`
    - **Response Body:**
      - `error (string)`: Error message for database-related issues.

## User Subscription API

This documentation provides information on the usage of two API endpoints: `/store-subscription` and `/check-subscription-status`. These endpoints are designed to handle subscription-related functionality for your application.

### `/store-subscription`

The `/store-subscription` endpoint is used to store subscription information for authenticated users.

- **HTTP Method:** `POST`
- **Endpoint:** `/store-subscription`

**Request**

- **Authentication:** Assumes the user is already authenticated.
- **Request Body Parameters:**
  - `plan (string)`: The subscription plan chosen by the user.
  - `paymentDate (string)`: The date of the payment for the subscription.
  - `endDate (string)`: The date on which the subscription will end.

**Response**

- **Success Response (HTTP Status 200 OK):**
  - Content: "Subscription information stored successfully"
- **Error Response (HTTP Status 500 Internal Server Error):**
  - Content: "Error storing subscription information"

**Description:**

1. Obtain the authenticated user's UID.
2. Create a reference to the database path under the user's data using the UID.
3. Create a 'subscriptions' node under the user's data and store the subscription information, including the plan, payment date, and end date.
4. If the subscription information is successfully stored, return a status of 200 OK with a success message. If there is an error, return a status of 500 Internal Server Error with an error message.

### `/check-subscription-status`

The `/check-subscription-status` endpoint is used to check the status of a user's subscription.

- **HTTP Method:** `GET`
- **Endpoint:** `/check-subscription-status`

**Request**

- **Authentication:** Assumes the user is already authenticated.

**Response**

- **Success Response (HTTP Status 200 OK):**
  - Content: JSON object with the following properties:
    - `active (boolean)`: Indicates whether the user has an active subscription (true or false).
    - `plan (string)`: The user's active subscription plan (null if there is no active subscription).
    - `endDate (string)`: The date on which the user's active subscription ends (null if there is no active subscription).

---

Feel free to modify and format this documentation as needed for your GitHub README.

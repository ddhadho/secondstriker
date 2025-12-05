# API Documentation

This document provides detailed documentation for the Second Striker API.

## Base URL

The base URL for all API endpoints is `/`.

## Authentication

Many endpoints require authentication using a JSON Web Token (JWT). To authenticate, include the JWT in the `Authorization` header of your request with the `Bearer` scheme:

`Authorization: Bearer <your-jwt>`

---

## User Endpoints

### `POST /users/register`

*   **Description:** Registers a new user.
*   **Authentication:** Not required.
*   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Registration successful. Verify OTP to complete login."
    }
    ```

### `POST /users/login`

*   **Description:** Logs in a registered user.
*   **Authentication:** Not required.
*   **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "string",
      "user": {
        "id": "string",
        "username": "string",
        "email": "string"
      }
    }
    ```

### `GET /users/profile`

*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Authentication:** Required.
*   **Response (200 OK):**
    ```json
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "walletBalance": "number"
    }
    ```
    
### `PUT /users/profile`

*   **Description:** Updates the profile of the currently authenticated user.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string",
      "phoneNumber": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Profile updated successfully",
      "user": {
        "username": "string",
        "email": "string",
        "phoneNumber": "string"
      }
    }
    ```
    
### `PUT /users/update-phone`

*   **Description:** Updates the phone number of the currently authenticated user.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "phoneNumber": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Phone number updated successfully",
      "phoneNumber": "string"
    }
    ```

---

## League Endpoints

### `POST /league`

*   **Description:** Creates a new league.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "name": "string",
      "numberOfTeams": "number",
      "entryFee": "number"
    }
    ```
*   **Response (201 Created):** The created league object.

### `GET /league`

*   **Description:** Retrieves a list of all leagues.
*   **Authentication:** Not required.
*   **Response (200 OK):** An array of league objects.

### `GET /league/:id`

*   **Description:** Retrieves a single league by its ID.
*   **Authentication:** Not required.
*   **Response (200 OK):** The league object.

---

## Tournament Endpoints

### `POST /tournament`

*   **Description:** Creates a new tournament.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "name": "string",
      "numberOfParticipants": "number",
      "entryFee": "number"
    }
    ```
*   **Response (201 Created):** The created tournament object.

### `GET /tournament`

*   **Description:** Retrieves a list of all tournaments.
*   **Authentication:** Not required.
*   **Response (200 OK):** An array of tournament objects.

### `GET /tournament/:id`

*   **Description:** Retrieves a single tournament by its ID.
*   **Authentication:** Not required.
*   **Response (200 OK):** The tournament object.

---

## Transaction Endpoints

### `POST /mpesa/stk-push`

*   **Description:** Initiates an M-Pesa STK push for a wallet deposit.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "amount": "number",
      "phoneNumber": "string"
    }
    ```
*   **Response (200 OK):** A message indicating the STK push has been initiated.

### `GET /wallet`

*   **Description:** Retrieves the wallet information for the currently authenticated user.
*   **Authentication:** Required.
*   **Response (200 OK):**
    ```json
    {
      "balance": "number",
      "transactions": [...]
    }
    ```

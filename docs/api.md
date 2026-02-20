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

### `POST /league/create`

*   **Description:** Creates a new league. The user creating the league is automatically added as the first member.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "name": "string",
      "fee": "number"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "league": {
        "leagueId": "string",
        "name": "string",
        "fee": "number",
        "createdAt": "date",
        "members": ["string"],
        "status": "string"
      },
      "userBalance": "number"
    }
    ```

### `PATCH /league/update/:leagueId`

*   **Description:** Updates a league's parameters. This can only be done by the league creator and only when the league is in `draft` status.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league to update.
*   **Request Body:**
    ```json
    {
      "fixtureType": "string",
      "awards": "object",
      "numberOfTeams": "number",
      "rules": ["string"]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "League updated successfully",
      "league": "object"
    }
    ```

### `GET /league/get`

*   **Description:** Retrieves a list of leagues that the currently authenticated user is a member of.
*   **Authentication:** Required.
*   **Response (200 OK):** An array of league objects.
    ```json
    [
      {
        "_id": "string",
        "name": "string",
        "fee": "number",
        "creator": {
          "username": "string"
        },
        "status": "string",
        "createdAt": "date"
      }
    ]
    ```

### `GET /league/get/:leagueId`

*   **Description:** Retrieves a single league by its ID.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league to retrieve.
*   **Response (200 OK):**
    ```json
    {
      "league": "object"
    }
    ```

### `GET /league/search-user`

*   **Description:** Searches for a user by their username.
*   **Authentication:** Required.
*   **Query Parameters:**
    *   `username` (string): The username to search for.
*   **Response (200 OK):**
    ```json
    {
      "users": ["object"],
      "totalUsers": "number",
      "currentPage": "number",
      "totalPages": "number"
    }
    ```

### `POST /league/invite`

*   **Description:** Sends a join request to a user for a specific league.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "leagueId": "string",
      "userId": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Join request sent to user"
    }
    ```

### `POST /league/respond/:requestId/:action`

*   **Description:** Responds to a join request.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `requestId` (string): The ID of the join request.
    *   `action` (string): The action to take ('accept' or 'reject').

### `GET /league/requests`

*   **Description:** Retrieves join requests for the currently authenticated user.
*   **Authentication:** Required.
*   **Response (200 OK):** An array of join request objects.

### `PATCH /league/start/:leagueId`

*   **Description:** Starts a league. This can only be done by the league creator when the league is in `draft` status and the number of members matches the `numberOfTeams`.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league to start.
*   **Response (200 OK):**
    ```json
    {
      "message": "League started successfully",
      "league": "object",
      "fixtures": ["object"],
      "table": ["object"]
    }
    ```

### `GET /league/:leagueId/table`

*   **Description:** Retrieves the league table for a given league.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league.
*   **Response (200 OK):** An array of table entry objects, sorted by points.

### `GET /league/:leagueId/fixtures`

*   **Description:** Retrieves the fixtures for a given league.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league.
*   **Response (200 OK):** An array of fixture objects.

### `PUT /league/:leagueId/updateFixtures/:fixtureId`

*   **Description:** Updates the result of a fixture. This can only be done by the league creator.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league.
    *   `fixtureId` (string): The ID of the fixture to update.
*   **Request Body:**
    ```json
    {
      "team1Score": "number",
      "team2Score": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Fixture result updated successfully",
      "fixture": "object",
      "team1Stats": "object",
      "team2Stats": "object"
    }
    ```

### `GET /league/:competitionId/fixturesComplete`

*   **Description:** Checks if all fixtures in a league are completed.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `competitionId` (string): The ID of the league.
*   **Response (200 OK or 400 Bad Request):** A message indicating the status.

### `POST /league/:leagueId/finish`

*   **Description:** Finishes a league and distributes the awards. This can only be done by the league creator when all fixtures are complete.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `leagueId` (string): The ID of the league to finish.
*   **Response (200 OK):**
    ```json
    {
      "message": "League completed and rewards distributed"
    }
    ```


---

## Tournament Endpoints

### `POST /tournament/create`

*   **Description:** Creates a new tournament. The user creating the tournament is automatically added as the first member.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "name": "string",
      "format": "string",
      "fee": "number"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "tournament": {
        "id": "string",
        "name": "string",
        "format": "string",
        "status": "string",
        "code": "string",
        "prizePool": "number"
      }
    }
    ```

### `PATCH /tournament/update/:tournamentId`

*   **Description:** Updates a tournament's parameters. This can only be done by the tournament creator and only when the tournament is in `draft` status.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament to update.
*   **Request Body:**
    ```json
    {
      "fixtureType": "string",
      "awards": "object",
      "teamsPerGroup": "number",
      "numberOfGroups": "number",
      "rules": ["string"]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Tournament updated successfully",
      "tournament": "object"
    }
    ```

### `GET /tournament/get`

*   **Description:** Retrieves a list of tournaments that the currently authenticated user is a member of.
*   **Authentication:** Required.
*   **Response (200 OK):** An array of tournament objects.
    ```json
    [
      {
        "_id": "string",
        "name": "string",
        "fee": "number",
        "creator": {
          "username": "string"
        },
        "format": "string",
        "status": "string",
        "createdAt": "date"
      }
    ]
    ```

### `GET /tournament/get/:tournamentId`

*   **Description:** Retrieves a single tournament by its ID.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament to retrieve.
*   **Response (200 OK):**
    ```json
    {
      "tournament": "object"
    }
    ```

### `POST /tournament/invite`

*   **Description:** Sends a join request to a user for a specific tournament.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "tournamentId": "string",
      "userId": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Join request sent to user"
    }
    ```

### `PATCH /tournament/start/:tournamentId`

*   **Description:** Starts a tournament. This can only be done by the tournament creator when the tournament is in `draft` status and the member count matches the configuration.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament to start.
*   **Response (200 OK):**
    ```json
    {
      "message": "Tournament started successfully",
      "tournamentId": "string",
      "groups": ["object"],
      "fixtures": ["object"]
    }
    ```

### `POST /tournament/:tournamentId/startKnockout`

*   **Description:** Progresses a tournament from the group stage to the knockout stage. This can only be done by the tournament creator when all group stage matches are completed.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
*   **Response (200 OK):**
    ```json
    {
      "message": "Knockout stages fixtures generated",
      "fixtures": ["object"]
    }
    ```

### `GET /tournament/:tournamentId/table`

*   **Description:** Retrieves the group stage tables for a given tournament.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
*   **Response (200 OK):** An array of table entry objects, sorted by points.

### `GET /tournament/:tournamentId/fixtures`

*   **Description:** Retrieves the group stage fixtures for a given tournament.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
*   **Response (200 OK):** An array of fixture objects.

### `GET /tournament/:tournamentId/knockoutFixtures`

*   **Description:** Retrieves the knockout stage fixtures for a given tournament.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
*   **Response (200 OK):** An array of fixture objects.

### `PUT /tournament/:tournamentId/updateFixtures/:fixtureId`

*   **Description:** Updates the result of a group stage fixture. This can only be done by the tournament creator.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
    *   `fixtureId` (string): The ID of the fixture to update.
*   **Request Body:**
    ```json
    {
      "team1Score": "number",
      "team2Score": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Fixture result updated successfully",
      "fixture": "object",
      "team1Stats": "object",
      "team2Stats": "object"
    }
    ```

### `PUT /tournament/:tournamentId/updateKnockoutFixtures/:fixtureId`

*   **Description:** Updates the result of a knockout stage fixture and progresses the winner to the next round. This can only be done by the tournament creator.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament.
    *   `fixtureId` (string): The ID of the fixture to update.
*   **Request Body:**
    ```json
    {
      "team1Score": "number",
      "team2Score": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Fixture updated successfully",
      "fixture": "object"
    }
    ```

### `GET /tournament/:competitionId/fixturesComplete`

*   **Description:** Checks if all group stage fixtures in a tournament are completed.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `competitionId` (string): The ID of the tournament.
*   **Response (200 OK or 400 Bad Request):** A message indicating the status.

### `POST /tournament/:tournamentId/finish`

*   **Description:** Finishes a tournament and distributes the awards. This can only be done by the tournament creator after the final match is complete.
*   **Authentication:** Required.
*   **Request Parameters:**
    *   `tournamentId` (string): The ID of the tournament to finish.
*   **Request Body:**
    ```json
    {
        "fixtureId": "string",
        "team1Score": "number",
        "team2Score": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Tournament completed and rewards distributed",
      "winner": "string",
      "firstPlacePrize": "number",
      "runnerUp": "string",
      "secondPlacePrize": "number"
    }
    ```


## Wallet & Transactions

### `POST /mpesa/deposit`

*   **Description:** Initiates an M-Pesa STK push to the user's registered phone number to deposit funds into their wallet.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "amount": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Deposit initiated successfully",
      "data": {
        "transactionId": "string",
        "checkoutRequestId": "string",
        "amount": "number",
        "currentBalance": "number"
      }
    }
    ```

### `POST /mpesa/withdraw`

*   **Description:** Initiates a withdrawal from the user's wallet to their registered phone number via M-Pesa B2C.
*   **Authentication:** Required.
*   **Request Body:**
    ```json
    {
      "amount": "number"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Withdrawal initiated successfully",
      "data": {
        "transactionId": "string",
        "conversationId": "string",
        "amount": "number",
        "newBalance": "number"
      }
    }
    ```

### `GET /mpesa/wallet`

*   **Description:** Retrieves the wallet balance and registered phone number for the currently authenticated user.
*   **Authentication:** Required.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "balance": "number",
      "phoneNumber": "string"
    }
    ```

### `GET /mpesa/transactions`

*   **Description:** Retrieves a list of transactions for the currently authenticated user.
*   **Authentication:** Required.
*   **Query Parameters:**
    *   `limit` (number, optional): The maximum number of transactions to return. Defaults to 10.
*   **Response (200 OK):** An array of transaction objects.


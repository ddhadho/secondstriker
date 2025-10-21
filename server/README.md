# Second Striker Server

This is the backend for the Second Striker application. It is a Node.js application that uses Express.js and MongoDB.

## Architecture

The server is built using a standard Model-View-Controller (MVC) architecture.

*   **Models:** Define the schema for the data that is stored in MongoDB.
*   **Views:** (Not used in this API-only server)
*   **Controllers:** Contain the business logic for the application.
*   **Routes:** Define the API endpoints and map them to the appropriate controller functions.
*   **Middleware:** Used for authentication, error handling, and other cross-cutting concerns.
*   **Services:** Contain the logic for interacting with external services, such as M-Pesa.
*   **Config:** Contains the configuration for the application.
*   **Utils:** Contains utility functions that are used throughout the application.

## Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory and add the environment variables listed in the `.env.example` file.
4.  Start the server:
    ```bash
    npm start
    ```

## API Endpoints

### Users

*   `POST /users/register`: Register a new user.
*   `POST /users/login`: Log in a user.
*   `POST /users/verify-otp`: Verify a user's OTP.
*   `POST /users/resend-otp`: Resend a user's OTP.
*   `GET /users/profile`: Get a user's profile.
*   `PATCH /users/profile`: Update a user's profile.
*   `PUT /users/phone`: Update a user's phone number.
*   `POST /users/forgot-password`: Request a password reset.
*   `POST /users/reset-password`: Reset a user's password.

### M-Pesa

*   `POST /mpesa/deposit`: Deposit money into a user's wallet.
*   `POST /mpesa/withdraw`: Withdraw money from a user's wallet.
*   `GET /mpesa/wallet`: Get a user's wallet balance.
*   `GET /mpesa/transactions`: Get a user's transaction history.
*   `POST /mpesa/callback`: Callback endpoint for M-Pesa.
*   `POST /mpesa/b2c/result`: Callback endpoint for M-Pesa B2C transactions.
*   `POST /mpesa/b2c/queue`: Callback endpoint for M-Pesa B2C transactions.

### Leagues

*   `POST /league/create`: Create a new league.
*   `PATCH /league/update/:leagueId`: Update a league's parameters.
*   `GET /league/get`: Get a user's leagues.
*   `GET /league/get/:leagueId`: Get a specific league by ID.
*   `GET /league/search-user`: Search for a user by username.
*   `POST /league/invite`: Invite a user to a league.
*   `POST /league/respond/:requestId/:action`: Respond to a join request.
*   `GET /league/requests`: Get a user's join requests.
*   `PATCH /league/start/:leagueId`: Start a league.
*   `GET /league/:leagueId/table`: Get a league's table.
*   `GET /league/:leagueId/fixtures`: Get a league's fixtures.
*   `PUT /league/:leagueId/updateFixtures/:fixtureId`: Update a fixture's result.
*   `GET /league/:leagueId/stats`: Get a league's stats.
*   `GET /league/:competitionId/fixturesComplete`: Check if all fixtures in a league are completed.
*   `POST /league/:leagueId/finish`: Finish a league and distribute rewards.

### Tournaments

*   `POST /tournament/create`: Create a new tournament.
*   `PATCH /tournament/update/:tournamentId`: Update a tournament.
*   `POST /tournament/invite`: Invite a user to a tournament.
*   `PATCH /tournament/start/:tournamentId`: Start a tournament.
*   `GET /tournament/:tournamentId/table`: Get a tournament's table.
*   `POST /tournament/:tournamentId/startKnockout`: Start a tournament's knockout stage.
*   `GET /tournament/get`: Get a user's tournaments.
*   `GET /tournament/get/:tournamentId`: Get a specific tournament by ID.
*   `GET /tournament/:tournamentId/fixtures`: Get a tournament's group stage fixtures.
*   `GET /tournament/:tournamentId/knockoutFixtures`: Get a tournament's knockout fixtures.
*   `GET /tournament/:competitionId/fixturesComplete`: Check if all fixtures in a tournament are completed.
*   `PUT /tournament/:tournamentId/updateFixtures/:fixtureId`: Update a fixture's result.
*   `PUT /tournament/:tournamentId/updateKnockoutFixtures/:fixtureId`: Update a knockout fixture's result.
*   `POST /tournament/:tournamentId/finish`: Finish a tournament and distribute rewards.

## M-Pesa Integration

The server is integrated with M-Pesa for handling deposits and withdrawals. The M-Pesa logic is located in the `server/services/mpesaService.js` file. The `WalletController.js` file contains the logic for handling deposits and withdrawals.

## Environment Variables

The server requires the following environment variables:

*   `PORT`: The port that the server should run on.
*   `MONGODB_URI`: The URI for the MongoDB database.
*   `JWT_SECRET`: The secret key for signing JWTs.
*   `MPESA_CONSUMER_KEY`: The consumer key for the M-Pesa API.
*   `MPESA_CONSUMER_SECRET`: The consumer secret for the M-Pesa API.
*   `MPESA_SHORTCODE`: The shortcode for the M-Pesa API.
*   `MPESA_PASSKEY`: The passkey for the M-Pesa API.
*   `BASE_URL`: The base URL for the application.

See the `.env.example` file for an example of how to set these variables.

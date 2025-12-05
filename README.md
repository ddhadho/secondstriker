# Second Striker

**Second Striker** is a full-stack web application designed for managing e-football leagues and tournaments. It provides a centralized platform for league administrators and players to track schedules, results, standings, and player statistics. The application also includes a built-in wallet system for managing entry fees and prize money, with seamless integration of the M-Pesa payment gateway for easy transactions.

## Live Demo

[Link to your live demo] 

## Features

*   **User Authentication:** Secure user registration and login with JWT-based authentication.
*   **League Management:**
    *   Create and manage leagues.
    *   Add and remove teams.
    *   Generate and manage league fixtures.
    *   Update match results and automatically calculate league tables.
*   **Tournament Management:**
    *   Create and manage single-elimination tournaments.
    *   Generate tournament brackets.
    *   Update match results and advance teams through the bracket.
*   **Wallet System:**
    *   Each user has a personal wallet to manage their funds.
    *   Deposit funds into the wallet using M-Pesa.
    *   Pay entry fees for leagues and tournaments.
    *   Receive prize money directly into the wallet.
*   **Player and Team Statistics:** Track key statistics for players and teams, such as goals scored, matches played, and more.
*   **Responsive UI:** A modern and responsive user interface built with the Quasar framework, ensuring a seamless experience across all devices.

## Technology Stack

The project is a monorepo with a Node.js backend and a Vue.js frontend.

### Backend (`/server`)

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** Passport.js with JWT strategy
*   **Testing:** Mocha, Chai, Supertest
*   **Other notable libraries:**
    *   `bcryptjs` for password hashing
    *   `jsonwebtoken` for JWT creation and verification
    *   `winston` for logging
    *   `nodemailer` for sending emails
    *   `axios` for making HTTP requests (e.g., to M-Pesa)

### Frontend (`/ui`)

*   **Framework:** Vue.js with the Quasar framework
*   **State Management:** Pinia
*   **Routing:** Vue Router
*   **HTTP Client:** Axios
*   **Build Tool:** Vite
*   **Linting and Formatting:** ESLint and Prettier

## Login Credentials

To explore the application's functionalities, you can use the following credentials:

*   **Email:** `Khamzat`
*   **Password:** `mypassword`


## Project Structure

The project is organized as a monorepo with two main directories:

*   `/server`: Contains the Node.js backend application, following a typical MVC-like structure (`models`, `controllers`, `routes`).
*   `/ui`: Contains the Vue.js frontend application, built with the Quasar framework and organized by feature (`components`, `pages`, `stores`).

A more detailed overview of the project's architecture can be found in the [technical documentation](docs/architecture.md).

## API Documentation

The API is documented using the OpenAPI specification. You can find the full API documentation [here](docs/api.md).


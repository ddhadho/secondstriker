# Project Architecture

This document provides a detailed overview of the technical architecture for both the backend and frontend of the Second Striker application.

## Backend Architecture (`/server`)

The backend is a Node.js application built with the Express.js framework. It follows a feature-oriented, MVC-like pattern and is responsible for handling all business logic, data persistence, and API endpoints.

### Directory Structure

The `/server` directory is organized as follows:

*   `/bin`: Contains the `www` script, which is the main entry point for starting the server.
*   `/config`: Holds configuration files for the database (`config.js`), email services (`email.js`), and other third-party integrations.
*   `/controllers`: Contains the core business logic of the application. Each controller corresponds to a specific resource (e.g., `LeagueController.js`, `UserController.js`) and handles incoming requests from the routes.
*   `/middleware`: Contains custom middleware functions, such as the `auth.js` middleware for authenticating and authorizing requests using JWT.
*   `/models`: Defines the Mongoose schemas for the MongoDB database. Each model represents a collection in the database (e.g., `User.js`, `League.js`).
*   `/routes`: Defines the API endpoints for the application. Each route file maps HTTP methods (GET, POST, PUT, etc.) to the corresponding controller functions.
*   `/services`: Contains modules that provide specific services, such as the `mpesaService.js` for interacting with the M-Pesa API.
*   `/test`: Contains the test suite for the backend, written with Mocha, Chai, and Supertest.
*   `/utils`: Contains utility functions that are used across the application, such as logging (`logger.js`) and validation (`validation.js`).
*   `app.js`: The main application file where the Express app is configured, middleware is loaded, and routes are mounted.
*   `db.js`: The database connection module.

### Data Models

The application uses the following Mongoose models:

*   **User:** Stores user information, including username, email, hashed password, and wallet balance.
*   **League:** Represents a sports league, including its name, teams, and fixtures.
*   **Tournament:** Represents a single-elimination tournament, including its name, participants, and bracket structure.
*   **Fixture:** Represents a single match between two teams, including the date, time, and result.
*   **Transaction:** Stores a record of all financial transactions, such as deposits, entry fee payments, and prize money payouts.
*   **JoinRequest:** Manages requests from users to join a league or tournament.

### Authentication Flow

Authentication is handled using JSON Web Tokens (JWT). The flow is as follows:

1.  A user registers or logs in with their credentials.
2.  If the credentials are valid, the server generates a JWT containing the user's ID and signs it with a secret key.
3.  The server sends the JWT back to the client.
4.  The client stores the JWT (e.g., in local storage) and includes it in the `Authorization` header of all subsequent requests to protected endpoints.
5.  The `auth.js` middleware on the server intercepts each request, verifies the JWT, and attaches the user's information to the request object.

## Frontend Architecture (`/ui`)

The frontend is a single-page application (SPA) built with Vue.js and the Quasar framework. It is responsible for providing a rich and interactive user experience.

### Directory Structure

The `/ui` directory is organized as follows:

*   `/src`: The main source code directory.
    *   `/boot`: Contains files that run before the main application is instantiated, such as for initializing Pinia and Axios.
    *   `/components`: Contains reusable Vue components that are used across multiple pages (e.g., `LeagueDetails.vue`, `TournamentBracket.vue`).
    *   `/css`: Contains global CSS and Sass files.
    *   `/layouts`: Defines the overall structure of the pages (e.g., `MainLayout.vue` with a header and sidebar).
    *   `/pages`: Contains the main pages of the application, which are mapped to routes (e.g., `LeaguesPage.vue`, `ProfilePage.vue`).
    *   `/router`: Contains the Vue Router configuration, which maps URLs to pages.
    *   `/stores`: Contains the Pinia stores, which manage the application's global state.
    *   `/utils`: Contains utility functions for the frontend.
*   `quasar.config.js`: The main configuration file for the Quasar framework.

### State Management

Global state management is handled by Pinia. The application has two main stores:

*   **`auth.js`:** Manages the user's authentication state, including the JWT and user information.
*   **`competition.js`:** Manages the state related to leagues and tournaments, such as the list of competitions, selected competition details, and fixtures.

The stores are responsible for fetching data from the backend API, caching it, and providing it to the components.

### Component-Based Structure

The UI is built using a component-based approach. Pages are composed of smaller, reusable components. This makes the code more modular, easier to maintain, and promotes code reuse.

For example, the `CompetitionPage.vue` is a high-level page that uses several smaller components, such as `CompetitionHeader.vue`, `LeagueDetails.vue`, and `LeagueFixtures.vue`, to display the details of a selected league.

# Second Striker

A web application for managing sports leagues and tournaments.

## Technology Stack

*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB with Mongoose
    *   Passport.js for authentication (JWT)
*   **Frontend:**
    *   Vue.js
    *   Quasar Framework
    *   Pinia for state management
    *   Axios for API communication

## Project Structure

The project is a monorepo containing two main parts:

*   `/server`: The Node.js backend API.
*   `/ui`: The Vue.js frontend application.

## Getting Started

### Prerequisites

*   Node.js (v16 or higher recommended)
*   A running MongoDB instance.

### Backend Setup (`/server`)

1.  **Navigate to the backend directory:**
    ```bash
    cd server
    ```

2.  **Create an environment file:**
    Create a file named `.env` in the `/server` directory and add the following variables.

    ```env
    # Application URLs
    FRONTEND_DEV_URL=http://localhost:9000
    BACKEND_DEV_URL=http://localhost:3000
    API_DEV_URL=http://localhost:3000/api

    # MongoDB Connection
    MONGO_DEV_URI=mongodb://localhost:27017/secondstriker

    # Authentication
    JWT_SECRET=your-super-secret-jwt-key
    SESSION_SECRET=your-super-secret-session-key

    # M-Pesa and Email (Optional, can be placeholders)
    MPESA_CONSUMER_KEY=placeholder
    MPESA_CONSUMER_SECRET=placeholder
    MPESA_PASSKEY=placeholder
    MPESA_INITIATOR_NAME=placeholder
    MPESA_SHORTCODE=placeholder
    MPESA_SECURITY_CREDENTIAL=placeholder
    EMAIL_USERNAME=placeholder
    EMAIL_PASSWORD=placeholder
    EMAIL_HOST=placeholder
    EMAIL_PORT=placeholder
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The backend will be running at `http://localhost:3000`.

### Frontend Setup (`/ui`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ui
    ```

2.  **Create an environment file:**
    Create a file named `.env` in the `/ui` directory and add the following variable:

    ```env
    VITE_API_BASE_URL=http://localhost:3000
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:9000`.


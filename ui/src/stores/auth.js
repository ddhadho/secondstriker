import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    username: localStorage.getItem('username'),
    userId: localStorage.getItem('userId'),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isAdmin: false,
    registrationEmail: null,
  }),
  getters: {
    checkIfAdmin: (state) => (creatorId) => {
      return state.userId === creatorId;
    },
  },
  actions: {
    async login(credentials) {
      try {
        const response = await api.post('/users/login', credentials);
        const { token, user } = response.data;
        this.token = token;
        this.username = user.username;
        this.userId = user.id;
        this.isAuthenticated = true;
        // Store token in local storage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', this.userId);
        localStorage.setItem('username', this.username);
        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Invalid username or password'
        };
      }
    },

    async register(userData) {
      try {
        const response = await api.post('/users/register', userData);

        // Store the email for OTP verification
        this.registrationEmail = userData.email;

        return {
          success: true,
          message: response.data.message
        };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Registration failed'
        };
      }
    },

    async verifyOtp(otpData) {
      try {
        const response = await api.post('/users/verify-otp', otpData);

        // Destructure token and user from response
        const { token, user } = response.data;

        // Update store state
        this.token = token;
        this.username = user.username;
        this.userId = user.id;
        this.isAuthenticated = true;

        // Persist authentication details
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('username', user.username);

        // Clear registration email
        this.registrationEmail = null;

        return {
          success: true,
          user: response.data.user
        };
      } catch (error) {
        console.error('OTP verification error:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'OTP verification failed'
        };
      }
    },

    async resendOtp(email) {
      try {
        const response = await api.post('/users/resend-otp', { email });

        return {
          success: true,
          message: response.data.message
        };
      } catch (error) {
        console.error('Resend OTP error:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to resend OTP'
        };
      }
    },

    logout() {
      this.token = null;
      this.username = null;
      this.userId = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    },

    initializeStore() {
      this.userId = localStorage.getItem('userId');
      this.username = localStorage.getItem('username');
      this.token = localStorage.getItem('token');
      this.isAuthenticated = !!this.token;

      // Optional: You could add a token validation API call here
      // if (this.token) {
      //   this.validateToken();
      // }
    }
  }
});

<template>
  <q-page class="auth-form-wrapper">
    <div class="auth-form-wrapper">
      <q-card class="auth-card q-pa-md">
        <q-card-section class="text-center">
          <div class="text-h6">Login</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="onSubmit" class="q-gutter-md">
            <!-- Username/Email Field -->
            <q-input
              v-model="usernameOrEmail"
              label="Username or Email"
            >
            </q-input>

            <!-- Password Field -->
            <q-input
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
            >
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <!-- Login Button -->
            <q-btn type="submit" color="primary" label="Login" class="q-mt-md">
            </q-btn>

            <!-- Register Toggle Button -->
            <q-btn flat label="Register" @click="goToRegister" class="q-mt-sm" />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

// Form data
const usernameOrEmail = ref('')
const password = ref('')
const showPassword = ref(false)

// Submit handler
const onSubmit = async () => {
  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail.value);
    const credentials = {
      password: password.value,
      ...(isEmail ? { email: usernameOrEmail.value } : { username: usernameOrEmail.value })
    };

    const result = await authStore.login(credentials);

    if (result.success) {
      router.push('/');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Login failed. Please try again.'
    });
  }
};


const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.auth-form-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.auth-card {
  width: 100%;
  max-width: 270px;
  border-radius: 20px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

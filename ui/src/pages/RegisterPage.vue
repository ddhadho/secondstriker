<template>
  <q-page class="auth-form-wrapper">
    <div class="auth-form-wrapper">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="auth-card q-pa-md">
          <q-card-section class="text-center">
            <div class="text-h6">Register</div>
          </q-card-section>
          <q-card-section>
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <q-input
                v-model="username"
                label="Username"
                :rules="[val => !!val || 'Username is required']"
              />
              <q-input
                v-model="email"
                label="Email"
                :rules="[val => !!val || 'Email is required']"
              />
              <q-input
                v-model="password"
                label="Password"
                type="password"
                :rules="[val => !!val || 'Password is required']"
              />
              <div>
                <q-btn type="submit" color="primary" label="Register" :loading="isLoading" />
              </div>
            </q-form>
          </q-card-section>
          <q-card-section>
            <div class="text-center">
              <q-btn flat @click="toggleLogin" label="Already have an account? Login" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- OTP Verification Modal -->
    <q-dialog v-model="showOtpModal" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="text-center">
          <div class="text-h6">Verify OTP</div>
          <div class="text-subtitle2 q-mt-sm">
            Enter the 6-digit code sent to {{ email }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="verifyOtp">
            <q-input
              v-model="otp"
              label="Enter OTP"
              mask="######"
              :rules="[
                val => !!val || 'OTP is required',
                val => val.length === 6 || 'OTP must be 6 digits'
              ]"
              hint="6-digit verification code"
              maxlength="6"
              type="number"
            />
            <div class="row justify-between q-mt-md">
              <q-btn
                type="submit"
                color="primary"
                label="Verify OTP"
                :loading="otpVerifying"
              />
              <q-btn
                flat
                color="secondary"
                label="Resend OTP"
                @click="resendOtp"
                :disable="cooldownActive"
              >
                {{ cooldownText }}
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useQuasar } from 'quasar'

// Refs for registration
const username = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)

// Refs for OTP
const showOtpModal = ref(false)
const otp = ref('')
const otpVerifying = ref(false)
const cooldownTime = ref(60)
const cooldownActive = ref(false)
const cooldownText = ref('Resend OTP')

// Composables
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

// Handle registration submission
const onSubmit = async () => {
  isLoading.value = true
  try {
    const result = await authStore.register({
      username: username.value,
      email: email.value,
      password: password.value
    })

    if (result.success) {
      $q.notify({
        color: 'positive',
        message: 'Registration successful. Please verify OTP.'
      })
      showOtpModal.value = true
    } else {
      $q.notify({
        color: 'negative',
        message: result.error
      })
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Registration failed'
    })
  } finally {
    isLoading.value = false
  }
}

// Verify OTP
const verifyOtp = async () => {
  otpVerifying.value = true
  try {
    const result = await authStore.verifyOtp({
      email: email.value,
      otp: otp.value
    })

    if (result.success) {
      $q.notify({
        color: 'positive',
        message: 'OTP Verified Successfully!'
      })
      showOtpModal.value = false
      router.push('/') // Redirect to home or dashboard
    } else {
      $q.notify({
        color: 'negative',
        message: result.error || 'OTP Verification Failed'
      })
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'An error occurred during OTP verification'
    })
  } finally {
    otpVerifying.value = false
  }
}

// Resend OTP with cooldown
const resendOtp = async () => {
  if (cooldownActive.value) return

  try {
    const result = await authStore.resendOtp({ email: email.value })

    if (result.success) {
      $q.notify({
        color: 'positive',
        message: 'New OTP sent successfully!'
      })
      startCooldown()
    } else {
      $q.notify({
        color: 'negative',
        message: result.error || 'Failed to resend OTP'
      })
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'An error occurred while resending OTP'
    })
  }
}

// Cooldown timer for resend OTP
const startCooldown = () => {
  cooldownActive.value = true
  let remainingTime = cooldownTime.value

  const timer = setInterval(() => {
    remainingTime--
    cooldownText.value = `Resend OTP (${remainingTime}s)`

    if (remainingTime <= 0) {
      clearInterval(timer)
      cooldownActive.value = false
      cooldownText.value = 'Resend OTP'
    }
  }, 1000)
}

// Navigate to login page
const toggleLogin = () => {
  router.push('/login')
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

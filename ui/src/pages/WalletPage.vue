<template>
  <q-page class="q-pa-sm">
    <!-- Header -->
    <div class="row items-center q-mb-sm">
      <q-btn flat dense icon="arrow_back" @click="handleGoBack" />
      <div class="text-subtitle1 q-ml-md">Wallet</div>
    </div>

    <!-- Main Content Grid - Maintained 2x2 -->
    <div class="row q-col-gutter-sm">
      <!-- Balance Box -->
      <div class="col-6">
        <q-card class="wallet-box">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">Balance</div>
            <div class="text-h6 text-weight-bold text-accent q-mt-xs">
              KES {{ formatAmount(balance) }}
            </div>
            <div class="text-caption text-grey-7 q-mt-xs ellipsis">
              Last updated: {{ formatDate(new Date()) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- MPesa Number Box -->
      <div class="col-6">
        <q-card class="wallet-box">
          <q-card-section class="q-pa-sm">
            <div class="row items-center justify-between">
              <div class="text-caption text-grey-7">MPesa Number</div>
              <q-btn
                flat
                dense
                :icon="mpesaNumber ? 'edit' : 'add'"
                :color="mpesaNumber ? 'secondary' : 'primary'"
                round
                size="xs"
                @click="showPhoneDialog = true"
              />
            </div>
            <div class="text-subtitle2 q-mt-xs ellipsis" :class="mpesaNumber ? 'text-secondary' : 'text-grey'">
              {{ mpesaNumber ? formatPhoneNumber(mpesaNumber) : 'Add number' }}
            </div>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <!-- Deposit Button -->
            <q-btn
              class="full-width q-mb-xs"
              color="positive"
              size="sm"
              @click="showDepositDialog = true"
            >
              <div class="row items-center justify-center">
                <q-icon name="add_circle" size="1.2rem" class="q-mr-xs" />
                <span class="text-caption">Deposit</span>
              </div>
            </q-btn>

            <!-- Withdraw Button -->
            <q-btn
              class="full-width"
              color="negative"
              size="sm"
              @click="showWithdrawDialog = true"
            >
              <div class="row items-center justify-center">
                <q-icon name="remove_circle" size="1.2rem" class="q-mr-xs" />
                <span class="text-caption">Withdraw</span>
              </div>
            </q-btn>
          </q-card-section>
        </q-card>
      </div>

      <!-- Transaction History Box -->
      <div class="col-6">
        <q-card class="wallet-box">
          <q-card-section class="q-pa-sm">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-grey-7">Transactions</div>
              <q-btn flat dense color="grey" label="All" size="xs" @click="handleViewAllTransactions" />
            </div>

            <q-list dense separator>
              <q-item v-for="transaction in recentTransactions.slice(0, 4)" :key="transaction.id" dense>
                <q-item-section avatar>
                  <q-icon
                    :name="transaction.type === 'deposit' ? 'arrow_downward' : 'arrow_upward'"
                    :color="transaction.type === 'deposit' ? 'positive' : 'negative'"
                    size="1rem"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-caption">
                    {{ transaction.type === 'deposit' ? '+' : '-' }} KES {{ formatAmount(transaction.amount) }}
                  </q-item-label>
                  <q-item-label caption>{{ formatDate(transaction.updatedAt) }}</q-item-label>
                  <q-item-label caption>{{ transaction.status }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="recentTransactions.length === 0" dense>
                <q-item-section class="text-center">
                  <q-item-label caption>No transactions</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-dialog v-model="showDepositDialog">
      <q-card class="q-pa-md" style="max-width: 300px; border-radius: 16px;" >
        <q-card-section>
          <div class="text-h6">Deposit</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="depositAmount"
            label="Amount to deposit"
            type="number"
            filled
            dense
            prefix="KES"
            :rules="[val => !!val || 'Amount is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="negative" label="Cancel" @click="showDepositDialog = false" :disable="isDepositing" />
          <q-btn
            flat
            color="positive"
            label="Deposit"
            @click="handleDeposit"
            :loading="isDepositing"
            :disable="isDepositing"
          >
            <template v-slot:loading>
              <q-spinner-dots color="positive" />
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showWithdrawDialog">
      <q-card class="q-pa-md" style="max-width: 300px; border-radius: 16px;">
        <q-card-section>
          <div class="text-h6">Withdraw</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="withdrawAmount"
            label="Amount to withdraw"
            type="number"
            filled
            dense
            prefix="KES"
            :rules="[val => !!val || 'Amount is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            color="negative"
            label="Cancel"
            @click="showWithdrawDialog = false"
            :disable="isWithdrawing"
          />
          <q-btn
            flat
            color="positive"
            label="Withdraw"
            @click="handleWithdraw"
            :loading="isWithdrawing"
            :disable="isWithdrawing"
          >
            <template v-slot:loading>
              <q-spinner-dots color="positive" />
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showPhoneDialog">
      <q-card class="q-pa-md" style="max-width: 300px; border-radius: 16px;">
        <q-card-section>
          <div class="text-h6 text-weight-medium">
            {{ mpesaNumber ? 'Edit MPesa Number' : 'Add MPesa Number' }}
          </div>
          <div class="q-mt-sm">
            <q-input
              filled
              v-model="newMpesaNumber"
              label="MPesa Number"
              type="tel"
              maxlength="12"
              :rules="[val => !!val || 'Number is required']"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" @click="showPhoneDialog = false" />
          <q-btn flat label="Save" color="positive" @click="updateMpesaNumber" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const router = useRouter()

// State
const balance = ref(0)
const mpesaNumber = ref('')
const newMpesaNumber = ref('')
const depositAmount = ref(null)
const withdrawAmount = ref(null)
const recentTransactions = ref([])
const isDepositing = ref(false)
const isWithdrawing = ref(false)

// Dialog controls
const showPhoneDialog = ref(false)
const showDepositDialog = ref(false)
const showWithdrawDialog = ref(false)

// Utility functions
const formatAmount = (amount) => {
  return Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatPhoneNumber = (number) => {
  if (!number) return ''
  return `+254 ${number.slice(-9)}`
}

const showSuccess = (message) => {
  $q.notify({
    type: 'positive',
    message,
    position: 'top',
    timeout: 2500
  })
}

const showError = (message) => {
  $q.notify({
    type: 'negative',
    message,
    position: 'top',
    timeout: 2500
  })
}

// Navigation handlers
const handleGoBack = () => {
  router.back()
}

const handleViewAllTransactions = () => {
  router.push('/mpesa/transactions')
}

// API calls
const fetchWallet = async () => {
  try {
    const response = await api.get('/mpesa/wallet')
    balance.value = response.data.balance
    mpesaNumber.value = response.data.phoneNumber || ''
  } catch (error) {
    showError('Error loading wallet details')
  }
}

const fetchRecentTransactions = async () => {
  try {
    const response = await api.get('/mpesa/transactions', {
      params: { limit: 5 }
    })
    recentTransactions.value = response.data
  } catch (error) {
    showError('Error loading transactions')
  }
}

const updateMpesaNumber = async () => {
  if (!newMpesaNumber.value) {
    showError('Please provide a valid phone number')
    return
  }

  try {
    const response = await api.put('/users/phone', { phoneNumber: newMpesaNumber.value })
    mpesaNumber.value = response.data.phoneNumber
    showPhoneDialog.value = false
    showSuccess('Phone number updated')
  } catch (error) {
    showError('Failed to update phone number')
  }
}

const handleDeposit = async () => {
  if (!depositAmount.value) return

  isDepositing.value = true
  try {
    await api.post('/mpesa/deposit', {
      amount: depositAmount.value
    })
    showDepositDialog.value = false
    depositAmount.value = null
    showSuccess('Deposit initiated')
  } catch (error) {
    showError('Deposit failed')
  } finally {
    await fetchWallet()
    await fetchRecentTransactions()
    isDepositing.value = false
  }
}

const handleWithdraw = async () => {
  if (!withdrawAmount.value) return

  isWithdrawing.value = true
  try {
    await api.post('/mpesa/withdraw', {
      amount: withdrawAmount.value
    })
    showWithdrawDialog.value = false
    withdrawAmount.value = null
    showSuccess('Withdrawal initiated')
  } catch (error) {
    showError('Withdrawal failed')
  } finally {
    await fetchWallet()
    await fetchRecentTransactions()
    isWithdrawing.value = false
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    fetchWallet(),
    fetchRecentTransactions()
  ])
})
</script>

<style scoped>
.wallet-box {
  border-radius: 12px;
  height: 100%;
  min-height: 120px;
}

/* Mobile optimizations */
@media (max-width: 599px) {
  .q-card {
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .wallet-box {
    min-height: 100px;
  }

  .q-btn {
    min-height: 32px;
    padding: 4px 8px;
  }

  /* Prevent text overflow */
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Ensure consistent card heights */
  .q-card-section {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}
</style>

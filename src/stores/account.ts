import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { accountService } from '@/services/accountService'
import type { Account } from '@/services/api'
import { useAuthStore } from './auth'

export const useAccountStore = defineStore('account', () => {
  // Estado
  const accounts = ref<Account[]>([])
  const selectedAccount = ref<Account | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasAccounts = computed(() => accounts.value.length > 0)
  const accountsCount = computed(() => accounts.value.length)
  const currentAccount = computed(() => selectedAccount.value)

  // Acciones
  async function fetchUserAccounts() {
    const authStore = useAuthStore()
    const userId = authStore.currentUserId

    if (!userId) {
      error.value = 'No hay un usuario autenticado'
      return false
    }

    loading.value = true
    error.value = null

    try {
      accounts.value = await accountService.getUserAccounts(userId)
      
      // Si hay cuentas y no hay una seleccionada, seleccionar la primera
      if (accounts.value.length > 0 && !selectedAccount.value) {
        selectAccount(accounts.value[0])
      }
      
      return true
    } catch (err: unknown) {
      console.error('Error al obtener cuentas:', err)
      
      if (err instanceof Error) {
        error.value = `Error al obtener cuentas: ${err.message}`
      } else {
        error.value = 'Error al obtener cuentas del usuario'
      }
      
      return false
    } finally {
      loading.value = false
    }
  }

  function selectAccount(account: Account) {
    selectedAccount.value = account
    accountService.saveSelectedAccount(account)
  }
  
  // Obtener una cuenta específica por su ID
  async function getAccountById(accountId: number) {
    const authStore = useAuthStore()
    const userId = authStore.currentUserId
    
    if (!userId) {
      error.value = 'No hay un usuario autenticado'
      return null
    }
    
    loading.value = true
    error.value = null
    
    try {
      const account = await accountService.getAccountById(userId, accountId)
      if (account) {
        // Si no hay una cuenta seleccionada, seleccionar esta
        if (!selectedAccount.value) {
          selectAccount(account)
        }
      }
      return account
    } catch (err: unknown) {
      console.error(`Error al obtener la cuenta ${accountId}:`, err)
      
      if (err instanceof Error) {
        error.value = `Error al obtener la cuenta: ${err.message}`
      } else {
        error.value = 'Error al obtener la cuenta'
      }
      
      return null
    } finally {
      loading.value = false
    }
  }

  // Inicializar estado desde localStorage
  function init() {
    const storedAccount = accountService.getSelectedAccount()
    if (storedAccount) {
      selectedAccount.value = storedAccount
    }
  }

  // Inicializar al crear el store
  init()

  return {
    accounts,
    selectedAccount,
    loading,
    error,
    hasAccounts,
    accountsCount,
    currentAccount,
    fetchUserAccounts,
    selectAccount,
    getAccountById
  }
})

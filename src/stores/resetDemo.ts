import { applySeed } from './hydrate'
import { useAuthStore } from './authStore'
import { useConfigStore } from './configStore'
import { clearPersistedDemo } from './persist'

export function resetDemo() {
  useAuthStore.getState().logout()
  useConfigStore.getState().resetMatriz()
  clearPersistedDemo()
  applySeed()
  window.location.assign('/login')
}

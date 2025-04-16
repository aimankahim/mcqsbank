<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Create your account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Username</label>
          <div class="mt-2">
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              @blur="checkUsername"
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              :class="{ 'ring-red-500': usernameExists }"
            />
          </div>
          <p v-if="usernameExists" class="mt-1 text-sm text-red-500">
            This username is already taken
          </p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email address</label>
          <div class="mt-2">
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
          <div class="mt-2">
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || usernameExists"
            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>

      <p class="mt-10 text-center text-sm text-gray-500">
        Already have an account?
        <router-link to="/login" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import type { RegisterData } from '@/services/auth'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const usernameExists = ref(false)

const form = reactive<RegisterData>({
  username: '',
  email: '',
  password: ''
})

const checkUsername = async () => {
  if (form.username.length < 3) return
  try {
    const username = form.username.toLowerCase().replace(/\s+/g, '')
    usernameExists.value = await authService.checkUsername(username)
    if (usernameExists.value) {
      error.value = `Username "${username}" is already taken. Please try a different name.`
    } else {
      error.value = ''
    }
  } catch (err) {
    console.error('Failed to check username:', err)
  }
}

const handleSubmit = async () => {
  if (usernameExists.value) {
    error.value = 'Please choose a different username'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authService.register(form)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Failed to create account'
    if (err.message.includes('username')) {
      usernameExists.value = true
    }
  } finally {
    loading.value = false
  }
}
</script> 
<script setup>
// composables
const { login } = useAuth()

// local page items
const apiKey = ref('')
</script>
<template>
  <v-form>
    <v-text-field v-model="apiKey" label="Api Key" required></v-text-field>
    <v-btn :disabled="!apiKey" color="success" @click="login(apiKey)">Submit</v-btn>
  </v-form>
</template>

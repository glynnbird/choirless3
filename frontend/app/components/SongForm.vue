<script setup>
// incoming programme to add/edit, whether the page is busy ot not and the submit button title
const { song, buttonTitle } = defineProps(['song', 'buttonTitle'])
const { busy } = useBusy()

// outgoing events from this form e.g. @submit="submitForm()"
const emitEvent = defineEmits(['submit'])

</script>
<template>
  <v-form>
    <v-text-field v-model="song.title" label="Title" required autofocus></v-text-field>
    <v-btn :disabled="song.title.length === 0 || busy" color="warning" class="mr-4" @click="emitEvent('submit')">
      {{ buttonTitle }}
    </v-btn>
  </v-form>
</template>

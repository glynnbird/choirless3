<script setup>

defineProps(['title', 'text', 'verb', 'displayDialog'])
const emit = defineEmits(['confirm', 'cancel'])
const show=ref(true)  //this does not do much, other than allow the dialog to display. But the v-if decides whether the dialog actually shows

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>
<template>
  <v-dialog v-model="show" v-if="displayDialog" max-width="500px" @click:outside="cancel">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        {{ text }}
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn text @click="confirm">{{ verb }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

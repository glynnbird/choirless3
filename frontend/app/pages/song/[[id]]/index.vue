<script setup>

// composables
const { getSong, calculateVideoURL, deleteTrack } = useSongsList()
const { showAlert } = useShowAlert()
const route = useRoute()
const id = route.params.id

// the song
const song = ref({})

// if we have an id
if (id) {
  song.value = await getSong(id)
  if (song.value === null) {
    showAlert('Could not load song', 'error')
  }
}
</script>
<style>
.track {
  margin-bottom: 15px;
}
.chippy {
  margin-left: 10px;
}
</style>
<template>
  <PageTitle :title="song.title"></PageTitle>
  <v-card class="track" v-for="track,t of song.tracks">
    <v-card-title>{{ track.partName }}</v-card-title>
    <v-subtitle>
    <v-chip class="chippy" color="primary" v-if="track.isBacking">Backing Track</v-chip>
    <v-chip class="chippy" color="secondary">Offset: {{ track.offset.toFixed(0) }}ms</v-chip>
    {{track.key}}
    </v-subtitle>
    <v-card-text>
      <VideoPlayer :url="calculateVideoURL(track)"></VideoPlayer>
    </v-card-text>
    <v-card-actions>
      <v-btn color="error" :disabled="track.isBacking && song.tracks.length > 1" @click="deleteTrack(song.id, t)">Delete</v-btn>
    </v-card-actions>
  </v-card>
  <v-btn color="primary" :to="`/song/${id}/record`">Add</v-btn>
</template>

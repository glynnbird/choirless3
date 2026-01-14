<script setup>

// composables
const { getSong, calculateVideoURL, deleteTrack } = useSongsList()
const { showAlert } = useShowAlert()
const route = useRoute()
const id = route.params.id
const displayDialog=ref(false)
const preDeleteTrackIndex=ref(null)
const preDeleteTrackName=ref('')

// the song
const song = ref({})

// if we have an id
if (id) {
  song.value = await getSong(id)
  if (song.value === null) {
    showAlert('Could not load song', 'error')
  }
}

async function preDeleteTrack(i, name) {
  preDeleteTrackIndex.value = i
  preDeleteTrackName.value = name
  displayDialog.value = true
}

async function actualDelete() {
  displayDialog.value = false
  await deleteTrack(id, preDeleteTrackIndex.value)
  preDeleteTrackIndex.value = null
  preDeleteTrackName.value = ''
}

</script>
<style>
.track {
  margin-bottom: 15px;
}
.chippy {
  margin-left: 10px;
}
.prejson {
  margin-top:25px;
  background-color: #444;
  color: white;
  padding: 25px;
}
</style>
<template>
   <ConfirmDialog title="Are you sure you want to delete this track?" :text="preDeleteTrackName" verb="Delete"
    :displayDialog="displayDialog" @cancel="displayDialog = false" @confirm="actualDelete"></ConfirmDialog>
  <PageTitle :title="song.title"></PageTitle>
  <v-card class="track" v-for="track,t of song.tracks">
    <v-card-title>{{ track.partName }}</v-card-title>
    <v-subtitle>
    <v-chip class="chippy" color="primary" v-if="track.isBacking">Backing Track</v-chip>
    <v-chip class="chippy" color="secondary">Offset: {{ track.offset.toFixed(0) }}ms</v-chip>
    </v-subtitle>
    <v-card-text>
      <v-expansion-panels>
      <v-expansion-panel title="Video">
        <v-expansion-panel-text>
          <VideoPlayer :url="calculateVideoURL(track)"></VideoPlayer>
        </v-expansion-panel-text>
      </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
    <v-card-actions>
      <v-btn color="error" :disabled="track.isBacking && song.tracks.length > 1" @click="preDeleteTrack(t,track.partName)">Delete</v-btn>
    </v-card-actions>
  </v-card>
  <v-btn color="primary" :to="`/song/${id}/record`">Add</v-btn>
  <pre class="prejson">{{ JSON.stringify(song, null, '  ') }}</pre>
</template>

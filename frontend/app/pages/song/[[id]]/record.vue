<script setup>
  const config = useRuntimeConfig()
  const { auth } = useAuth()
  const apiHome = config.public['apiBase'] || window.location.origin
  const { showAlert } = useShowAlert()
  const route = useRoute()
  const { getSong, updateSong } = useSongsList()

  // local refs
  const partName = ref('')
  const recording = ref(false)
  const recorder = ref(null)
  const recordingComplete = ref(false)
  const recordedVideo = ref(null)
  const songId = ref(route.params.id)
  const isBacking = ref(true)
  const offset = ref(0)
  const song = ref({})
  song.value = await getSong(songId.value)

  async function record() {
    recordingComplete.value = false
    recordedVideo.value = null
    recorder.value.record()
    recording.value = true
  }
  
  async function stop() {
    recordedVideo.value = await recorder.value.stop()
    console.log(recordedVideo.value)
    recording.value = false
    recordingComplete.value = true
  }

  async function save() {
    let meta = {
      partId: new Date().getTime(),
      songId: songId.value,
      partName: partName.value,
      isBacking: isBacking.value,
      offset: offset.value,
      key: ''
    }
    meta.key = await cloudSaveVideo(meta.songId, meta.partId, recordedVideo.value.blob)
    song.value.tracks.push(meta)
    await updateSong(meta.songId, song.value)
    await navigateTo(`/song/${meta.songId}`)
  }

  async function cloudSaveVideo(songId, partId, blob) {
    const u = new URL('/api/vidput', apiHome)
    const k = `${songId}/${partId}.webm`
    u.searchParams.append('key', k)
    await $fetch(u.toString(), {
      method: 'POST',
      body: blob,
      headers: {
        'content-type': 'video/webm',
        'content-length': blob.size,
        apikey: auth.value.apiKey
      }
    })
    await showAlert('Video saved')
    return k
  }

</script>


<template>
 {{partName }}{{  songId }} {{ isBacking }} {{ offset }} {{ song }}

  <!-- activate camera -->

    <!-- activate camera button -->
  <v-text-field label="Part Name" v-model="partName"></v-text-field>
  <Recorder ref="recorder" title="You"></Recorder>
  <v-btn color="primary" :disabled="recording || partName ==''" @click="record">Record</v-btn>
  <v-btn color="danger" :disabled="!recording" @click="stop">Stop</v-btn>
  <v-btn color="error" :disabled="!recordedVideo" @click="save">Save</v-btn>
  <VideoPlayer title="Recording" :url="recordedVideo.videoURL" v-if="recordingComplete"></VideoPlayer>
</template>

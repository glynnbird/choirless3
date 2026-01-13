<script setup>
  const config = useRuntimeConfig()
  const { auth } = useAuth()
  const apiHome = config.public['apiBase'] || window.location.origin
  const { showAlert } = useShowAlert()
  const route = useRoute()
  const { getSong, updateSong, calculateVideoURL } = useSongsList()

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
  const backingTrackURL = ref('')
  const backingvp = ref(null)
  let perfStartTime = 0
  song.value = await getSong(songId.value)

  // if there's tracks already there, then this isn't the backing track
  if (song.value.tracks.length > 0) {
    const backingTrack = song.value.tracks.filter((t) => {
      if (t.isBacking) {
        return true
      }
    })
    if (backingTrack.length > 0) {
      isBacking.value = false
      backingTrackURL.value = calculateVideoURL(backingTrack[0])
    }
  }

  async function record() {
    recordingComplete.value = false
    recordedVideo.value = null
    perfStartTime = await recorder.value.record()
    console.log('perfStartTime', perfStartTime)
    if (!isBacking.value) {
      backingvp.value.play()
      setTimeout(calculateOffset, 3000)
    }
    recording.value = true
  }
  
  async function stop() {
    recordedVideo.value = await recorder.value.stop()
    recording.value = false
    recordingComplete.value = true
    if (!isBacking.value) {
      backingvp.value.stop()
    }
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

  async function calculateOffset() {
    const a = backingvp.value.getCurrentTime()
    const b = recorder.value.getCurrentTime() - perfStartTime
    console.log('a',a,'b',b)
    offset.value = Math.abs((a - b) * 1000)
  }

</script>


<template>
  <v-text-field label="Part Name" v-model="partName"></v-text-field>
  <v-row>
    <v-col><Recorder ref="recorder" title="Live"></Recorder></v-col>
    <v-col v-if="!isBacking"><VideoPlayer ref="backingvp" :url="backingTrackURL" title="Backing"></VideoPlayer></v-col>
  </v-row>
  <v-btn color="primary" :disabled="recording || partName ==''" @click="record">Record</v-btn>
  <v-btn color="danger" :disabled="!recording" @click="stop">Stop</v-btn>
  <v-btn color="error" :disabled="!recordedVideo" @click="save">Save</v-btn>
  <VideoPlayer title="Recording" :url="recordedVideo.videoURL" v-if="recordingComplete"></VideoPlayer>
</template>

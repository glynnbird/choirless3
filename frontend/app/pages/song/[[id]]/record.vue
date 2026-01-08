<script setup>
  const recording = ref(false)
  const recorder = ref(null)
  const recordingComplete = ref(false)
  const recordedVideo = ref(null)

  async function record() {
    recorder.value.record()
    recording.value = true
  }
  
  async function stop() {
    recordedVideo.value = await recorder.value.stop()
    recording.value = false
    recordingComplete.value = true
  }

</script>


<template>


  <!-- activate camera -->

    <!-- activate camera button -->

  <Recorder ref="recorder" title="You"></Recorder>
  <v-btn color="primary" :disabled="recording" @click="record">Record</v-btn>
  <v-btn color="danger" :disabled="!recording" @click="stop">Stop</v-btn>
  <VideoPlayer title="Recording" :url="recordedVideo.videoURL" v-if="recordingComplete"></VideoPlayer>
</template>

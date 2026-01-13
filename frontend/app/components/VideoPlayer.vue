<script setup>
const props = defineProps(["title","url"])
const recordedVideo = ref(null)
setTimeout(function() {
  recordedVideo.value.src = props.url
}, 50)

async function play() {
  recordedVideo.value.currentTime = 0
  recordedVideo.value.play()
}

async function stop() {
  recordedVideo.value.pause()
}

function getCurrentTime() {
  return recordedVideo.value.currentTime
}

defineExpose({
  play,
  stop,
  getCurrentTime
})
</script>
<style>
.vp {
  max-width: 400px;
}
</style>
<template>
  <div>
    <h2>{{ props.title }}</h2>
    <div>
      <video class="vp" data="rv" ref="recordedVideo" controls></video>
    </div>
  </div>
</template>

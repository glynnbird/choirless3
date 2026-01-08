<script setup>
const props = defineProps(["title","url"])
const recordedVideo = ref(null)
setTimeout(function() {
  recordedVideo.value.src = props.url
}, 50)
</script>
<template>
  <div>
    <h2>{{ props.title }}</h2>
    <div>
      <video data="rv" ref="recordedVideo" controls></video>
    </div>
  </div>
</template>

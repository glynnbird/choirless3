<script setup>
const props = defineProps(["title"])
const noMediaDevices = ref(false)
const streamWidth = ref(0)
const streamHeight = ref(0)
const performanceStream = ref(null)
const performanceVideo = ref(null)
const performanceData = ref([])
const recording = ref(false)
const audioLevel = ref(0)
let mR

async function enableCapture() {
  if (typeof navigator.mediaDevices === "undefined") {
    noMediaDevices.value = true
    return;
  }
  const listOfDevices = await navigator.mediaDevices.enumerateDevices()
  console.log(listOfDevices)
  var constraints = {
    video: true,
    audio: { latency: 0.05, echoCancellation: false },
  };
  let stream;
  let analyser
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256 // smaller = faster + smoother meter
    source.connect(analyser)
  } catch (e) {
    console.log("error", e);
    noMediaDevices.value = true;
    return;
  }
  console.log('stream', stream)


  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  function getAudioLevel() {
    analyser.getByteTimeDomainData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128
      sum += value * value
    }

    const rms = Math.sqrt(sum / dataArray.length)
    return rms // value between ~0 and ~1
  }
  function updateMeter() {
    const level = getAudioLevel()
    // Example: normalize + clamp
    const normalized = Math.min(level * 3, 1)
    // Update UI
    audioLevel.value = normalized
    requestAnimationFrame(updateMeter)
  }
  updateMeter()

  performanceStream.value = stream;
  streamWidth.value = stream.getVideoTracks()[0].getSettings().width;
  streamHeight.value = stream.getVideoTracks()[0].getSettings().height;
  //var a = stream.getAudioTracks()[0];

  setTimeout(function () {
    performanceVideo.value.srcObject = stream
    performanceVideo.value.play()
  }, 100)
}


async function record() {
  recording.value = true
  performanceData.value = []
  // Oh Firefox, why you gotta do me like this?
  // start MediaRecorder and add event handlers to
  // collect the data as it arrives
  if (navigator.userAgent.indexOf("Firefox") === -1) {
    mR = new MediaRecorder(performanceStream.value, {
      mimeType: "video/webm; codecs=vp9",
    });
  } else {
    mR = new MediaRecorder(performanceStream.value);
  }
  mR.ondataavailable = function (e) {
    performanceData.value.push(e.data)
  };
  mR.onstop = function (e) { }
  mR.start(50)
  return performanceVideo.value.currentTime
}

function getCurrentTime() {
  if (recording.value) {
    return performanceVideo.value.currentTime
  } else {
    return 0
  }
}

async function stop() {
  recording.value = false
  mR.stop()

  // create video URL
  const blob = new Blob(performanceData.value, { type: "video/webm" })
  const videoURL = window.URL.createObjectURL(blob)

  // return everything we know about the video
  return {
    streamWidth: streamWidth.value,
    streamHeight: streamHeight.value,
    performanceData: performanceData.value,
    videoURL: videoURL,
    blob: blob
  }
}


// function exposed to the parent
defineExpose({
  record,
  stop,
  getCurrentTime
})

setTimeout(enableCapture, 50)
</script>
<style>
.vr {
  max-width: 400px;
}
.vid {
  width:400px;
}
</style>
<template>
  <div>
    <h2>{{ title }}</h2>
    <v-alert color="danger" v-if="noMediaDevices">ERROR: No video camera found</v-alert>
    <div class="vid">
      <video class="vr" v-if="!noMediaDevices" data="pv" ref="performanceVideo" muted></video>
      <v-progress-linear :model-value="audioLevel" max="1"></v-progress-linear>
    </div>
  </div>
</template>

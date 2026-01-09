<script setup>
const props = defineProps(["title"])
const noMediaDevices = ref(false)
const streamWidth = ref(0)
const streamHeight = ref(0)
const performanceStream = ref(null)
const performanceVideo = ref(null)
const performanceData = ref([])
const recording = ref(false)
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
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    console.log("error", e);
    noMediaDevices.value = true;
    return;
  }
  console.log('stream', stream)

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
  mR.start(50);
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
<template>
  <div>
    <h2>{{ title }}</h2>
    <video data="pv" ref="performanceVideo" muted></video>
  </div>
</template>

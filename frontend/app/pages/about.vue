<script setup>
const env = ref(process.env.NODE_ENV)

// config
const config = useRuntimeConfig()
const apiHome = config.public['apiBase'] || window.location.origin
</script>
<template>
  <PageTitle title="About Choirless"></PageTitle>
  <div>
    A simple video/audio recorder
  </div>
  <pre>
    Environment: {{ env }}
    Api Home: {{ apiHome }}
  </pre>
</template>

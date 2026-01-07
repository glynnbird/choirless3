<script setup>

// composables
const { getSongFromAPI } = useSongsList()
const route = useRoute()
const id = route.params.id

// the song
const song = ref({})

// if we have an id
if (id) {
  try {
    song.value = await getSongFromAPI(id)
  } catch (e) {
    console.error('failed to fetch song', e)
  }
}
</script>
<template>
  {{  song }}

</template>

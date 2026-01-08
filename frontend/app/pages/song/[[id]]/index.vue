<script setup>

// composables
const { songs, getSongFromAPI, locateIndex, emptyProg } = useSongsList()
const { getSongCache, setSongCache } = useSingleSongCache()
const route = useRoute()
const id = route.params.id

// the song
const song = ref({})

// if we have an id
if (id) {
  try {
    // if the programme is in the prog cache, use it
    const p = getSongCache(id)
    if (p) {
      song.value = p
    } else {
      // otherwise do a first quick load from prog list
      const i = locateIndex(id)
      console.log('located index', i)
      if (id) {
        song.value = songs.value[i]
      }

      // then load the full prog in the background
      setTimeout(async () => {
        song.value = await getSongFromAPI(id)
        setSongCache(id, song.value)
      }, 1)
    }
  } catch (e) {
    console.error('failed to fetch song', e)
  }
}
</script>
<template>
  {{ song }}
   <PageTitle :title="song.title"></PageTitle>
   <v-btn color :to="`/song/${id}/record`">Add</v-btn>
</template>

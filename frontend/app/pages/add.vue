<script setup>
// composables
const { addSong, emptySong } = useSongsList()

// local page items
const song = ref(emptySong())

// method - add new programme 
async function add() {
  if (song.value.title) {
    // save the new programme
    await addSong(JSON.parse(JSON.stringify(song.value)))

    // bounce to home page
    await navigateTo('/')
  }
}
</script>
<template>
  <PageTitle title="Add"></PageTitle>
  <SongForm :song="song" buttonTitle="Add" @submit="add()"></SongForm>
</template>

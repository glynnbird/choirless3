<script setup>
  const { songs } = useSongsList()
</script>
<style>
  .songcard {
    margin-bottom: 15px;
  }
</style>
<template>
  <!-- refresh the app -->
  <PWARefresh></PWARefresh>
  <v-card class="songcard" v-for="song in songs" :to="`/song/${song.id}`">
    <v-card-title>{{ song.title }}</v-card-title>
    <v-card-text>
      <v-chip size="small" label color="black">{{ song.numTracks || 0}}</v-chip> tracks
    </v-card-text>
  </v-card>
</template>

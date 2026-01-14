<script setup>
  const { songs, deleteSong } = useSongsList()
</script>
<style>
  .songcard {
    margin-bottom: 15px;
  }
</style>
<template>
  <!-- refresh the app -->
  <PWARefresh></PWARefresh>
  <v-card class="songcard" v-for="song in songs">
    <v-card-title>{{ song.title }}</v-card-title>
    <v-card-text>
      <v-chip size="small" label color="black">{{ song.numTracks || 0}}</v-chip> tracks
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" :to="`/song/${song.id}`">Edit</v-btn>
      <v-btn color="error" @click="deleteSong(song.id)" v-if="song.numTracks === 0">Delete</v-btn>
    </v-card-actions>
  </v-card>
</template>

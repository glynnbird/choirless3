// the default export
export default function () {
  const { songs, locateIndex } = useSongsList()

  function setSongCache(id, song) {
    const i = locateIndex(id)
    if (i) {
      console.log('song cache set', id)
      song.full = true
      songs.value[i] = song
    }
  }

  function getSongCache(id) {
    const i = locateIndex(id)
    if (i && songs.value[i].full) {
      console.log('song cache hit', id)
      return songs.value[i]
    } else {
      console.log('song cache miss', id)
      return null
    }
  }

  return { setSongCache, getSongCache }
}

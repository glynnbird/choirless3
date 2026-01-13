const SONGS_KEY = 'songscache'

// the default export
export default function () {

  // composables
  const songs = useState('songs', () => [])
  const stick = useState('stick', () => { return false })
  const { auth } = useAuth()
  const { setBusy, unsetBusy } = useBusy()
  const config = useRuntimeConfig()
  const { showAlert } = useShowAlert()
  const apiHome = config.public['apiBase'] || window.location.origin

  // create a custom fetch, prefilled with common stuff
  const $api = $fetch.create({
    baseURL: apiHome,
    method: 'post',
    headers: {
      'content-type': 'application/json',
      apikey: auth.value.apiKey
    }
  })

  // empty song
  function emptySong() {
    return {
      title: '',
      tracks: [],
      ts: Math.floor(new Date().getTime() / 1000)
    }
  }

  // load songs from the API
  async function loadFromAPI() {
    setBusy()
    try {
      //  fetch the list from the API
      console.log('API', '/api/list')
      const r = await $api('/api/list')
      songs.value = r.list
      localStorage.setItem(SONGS_KEY, JSON.stringify(songs.value))
      
    } catch (e) {
      console.error('failed to fetch list of songs', e)
    }
    unsetBusy()
  }

  // add a new song
  async function addSong(song, push = true) {
    setBusy()
    try {
      console.log('API', '/api/add')
      song.numTracks = song.tracks.length
      const doc = {}
      Object.assign(doc, song)
      const ret = await $api('/api/add', { body: doc })
      song.id = ret.id
      if (push) {
        songs.value.push(song)
      } else {
        const ind = locateIndex(song.id)
        if (ind !== -1) {
          songs.value[ind] = song
        }
      }
      localStorage.setItem(SONGS_KEY, JSON.stringify(songs.value))
      
      // create alert
      showAlert('Added/updated song', 'primary')
    } catch (e) {
      console.error(e)
    }
    unsetBusy()
  }

  async function getSongFromAPI(id) {
    let retval = {}
    setBusy()
    //  fetch the list from the API
    try {
      console.log('API', '/api/get')
      const r = await $api('/api/get', { body: { id } })
      retval = r.doc
    } catch (e) {
      console.error('Could not load song', id, e)
      // create alert
      showAlert('Could not load song', 'warning')
    }
    unsetBusy()
    return retval
  }

  const locateIndex = (id) => {
    let i
    for (i in songs.value) {
      if (id === songs.value[i].id) {
        return i
      }
    }
    return -1
  }

  // delete a song
  async function deleteSong(id) {
    const ind = locateIndex(id)
    if (ind) {
      songs.value.splice(ind, 1)
    }
    setBusy()
    console.log('API', '/api/del', id)
    await $api('/api/del', { body: { id } })
    unsetBusy()

    // create alert
    showAlert('Deleted Song', 'error')
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs.value))
  }

  // load the data from the cache & the API, but only the first time this is invoked
  if (stick.value === false && songs.value.length === 0) {

    // load existing songs from localStorage
    console.log('loading from cache')
    const cache = localStorage.getItem(SONGS_KEY)
    if (cache) {
      songs.value = JSON.parse(cache)
    }

    // then later get fresh data from the API
    setTimeout(async () => {
      console.log('loading from API')
      await loadFromAPI()
      stick.value = true
    }, 1)
  }

  async function updateSong(id, song) {
    const i = locateIndex(id)
    if (i === -1) {
      return null
    }
    await addSong(song, false)
    songs.value[i] = song
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs.value))
  }

  async function getSong(id) {
    const i = locateIndex(id)
    if (i === -1) {
      return null
    }
    if (songs.value[i].full) {
      console.log('song cache hit', id)
      return songs.value[i]
    } else {
      setBusy()
      const s = await getSongFromAPI(id)
      unsetBusy()
      s.full = true
      songs.value[i] = s
      console.log('song cache miss', id)
      localStorage.setItem(SONGS_KEY, JSON.stringify(songs.value))
      return songs.value[i]
    }
  }

  async function deleteTrack(songId, trackOffset) {
    const i = locateIndex(songId)
    if (i === -1) {
      return null
    }
    if (trackOffset >= songs.value[i].tracks[trackOffset].length) {
      return null
    }
    const key = songs.value[i].tracks[trackOffset].key
    songs.value[i].tracks.splice(trackOffset, 1)
    await updateSong(songId, songs.value[i])
    await $api('/api/viddel', { body: { key } })
  }

  function calculateVideoURL(track) {
    if (!track.key) {
      return ''
    }
    const u = new URL('/api/vidget', apiHome)
    u.searchParams.append('apikey', auth.value.apiKey)
    u.searchParams.append('key', track.key)
    return u.toString()
  }

  return { songs, deleteTrack, calculateVideoURL, getSong, updateSong, locateIndex, emptySong, addSong, loadFromAPI, deleteSong, getSongFromAPI }
}

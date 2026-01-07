export default function () {
  // whether we're busy doing API calls or not
  const busy = useState('busy', () => { return false })

  function setBusy() {
    busy.value = true
  }

  function unsetBusy() {
    busy.value = false
  }

  // return the flag and the functions that act upon it
  return { busy, setBusy, unsetBusy }
}

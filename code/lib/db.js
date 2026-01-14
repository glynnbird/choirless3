
export const toggle = async function (kv, id, ts) {
  const { value, metadata } = await kv.getWithMetadata(`doc:${id}`)
  if (value === null) {
    return { ok: false }
  }
  const j = JSON.parse(value)
  await del(kv, id)
  j.watching = !j.watching
  j.ts = ts
  await add(kv, j)
  return { ok: true }
}

export const get = async function (kv, id, archived=false) {
  const r = await kv.get(id)
  if (r === null) {
    return { ok: false }
  } else {
    const j = JSON.parse(r)
    return { ok: true, doc: j }
  }
}

export const list = async function (kv) {
  const l = await kv.list()
  const output = l.keys.map((k) => {
    return {
      id: k.name,
      ...k.metadata
    }
  })
  return output
}

const generateMetadata = function (doc) {
  return {
    date: doc.date,
    title: doc.title,
    numTracks: doc.tracks ? doc.tracks.length : 0,
    ts: doc.ts
  }
}

export const add = async function (kv, json) {
  const metadata = generateMetadata(json)

  // if there's all the parts we need
  if (json && json.id && metadata) {
    await kv.put(json.id, JSON.stringify(json), { metadata })

    // send response
    return { ok: true, id: json.id }
  }

  // oops
  return { ok: false }
}

export const del = async function (kv, id) {

  // delete original doc
  await kv.delete(id)

  return { ok: true }
}

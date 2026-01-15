// environment variables

const LOCAL_BUCKETS_PATH = '../videos'

// node modules
const fs = require('fs')
const path = require('path')
const util = require('node:util')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegrunner = require('choirlessffmpegrunner')
const run = ffmpegrunner.run
const probe = ffmpegrunner.probe
const crypto = require("crypto")
const boxjam = require('boxjam')



const convertFormat = async (key) => {
  if (!fs.existsSync(key)) {
    console.error('File does not exist', key)
    return
  }
  console.log(`Running on ${key}`)
  const outputKey = key.replace('.webm', '_converted.nut')
  if (fs.existsSync(outputKey)) {
    console.error('No need to process - target already exists', outputKey)
    return
  }

  const probeResults = await probe(key)
  const videoPresent = !!(probeResults.streams.filter((s) => s.codec_type === 'video').length)
  const audioPresent = !!(probeResults.streams.filter((s) => s.codec_type === 'video').length)

  // set ffmpeg inputs
  const command = ffmpeg()
    .input(key)
  if (videoPresent) {
    // force input video to 25 fps, 640x480
    command
      .videoFilter('fps=fps=25:round=up')
      .videoFilter('scale=640x480:force_original_aspect_ratio=decrease:force_divisible_by=2')
  } else {
    // black dummy video
    command
      .input('color=color=black:size=vga')
      .inputFormat('lavfi')
  }
  if (!audioPresent) {
    // silent dummy audio
    command
      .input('anullsrc')
      .inputFormat('lavfi')
  }

  // set output parameters
  command
    .output(outputKey)
    .outputFormat('nut') // nut container
    .outputOptions([
      '-acodec pcm_f32le', // PCM audio
      '-vcodec libx264', // H.264 video
      '-preset slow', // fast
      '-r 25', // 25 fps
      '-ac 2']) // mono
  await run(command, true)
}


const stripAudio = async (key, offset) => {
  if (!fs.existsSync(key)) {
    console.error('File does not exist', key)
    return
  }
  console.log(`Stripping audio from on ${key}`)
  const outputKey = key.replace('.webm', '_audio.wav')
  if (fs.existsSync(outputKey)) {
    console.error('No need to process - target already exists', outputKey)
    return
  }
  // set ffmpeg inputs
  const command = ffmpeg()
    .input(key)
    .noVideo()
    .audioFilters([
      { filter: 'atrim', options: { start: offset } },
      { filter: 'asetpts', options: 'PTS-STARTPTS' }
    ])
    .output(outputKey)
    .outputFormat('wav')
  await run(command, true)
}




// reverse the order of a string
function reverseString(str) {
  if (typeof str != 'string') {
    str = str.toString()
  }
  return str.split('').reverse().join('')
}

const defaultOpts = {
  width: 1920,
  height: 1080,
  reverb: 0.05,
  reverbType: 'hall',
  panning: true,
  watermark: 'choirless_watermark.png',
  margin: 25,
  center: true,
  name: 'auto'
}

function generateRunbook(inputs) {
  /*
  { part_id: r.id,
    size: [width, height],
    volume: 1.0,
    panning: 0,
    offset: partMap[r.id].offset,
    position: [x, y] }*/
  const rows = []
  const runbook = {
    slices: {},
    rowsHash: null,
    runId: crypto.randomUUID().slice(0, 8),
    rows: null
  }
  for (const i of inputs) {
    const y = i.position[1]
    if (!rows.includes(y)) {
      rows.push(y)
      runbook.slices[y] = []
    }
    runbook.slices[y].push(i)
  }
  rows.sort((a, b) => parseInt(a) - parseInt(b))
  const rowsStr = rows.join('-')
  runbook.rowsHash = crypto.createHash('sha1').update(rowsStr).digest('hex').slice(0, 8)
  runbook.rows = rows
  return runbook
}


async function render(song, opts) {
  // get optional parameters
  opts = Object.assign(defaultOpts, opts)

  // turn the song parts in to an array of rectangle objects
  const partMap = {}
  const rectangles = []
  const hiddenParts = []
  for (const i in song.tracks) {
    const p = song.tracks[i]
    const w = p.width || 640
    const h = p.height || 480
    const obj = {
      id: p.partId,
      width: w,
      height: h,
      volume: 1
    }
    rectangles.push(obj)

    // add to part map - to allow quick lookup of offset by partId
    if (typeof p.offset !== 'number') {
      p.offset = 0
    }
    partMap[p.partId] = p
  }

  // sort the rectangles into a deterministic random order (i.e not totally random, but
  // and not in time-of-recording order)
  rectangles.sort(function (a, b) {
    // sort by the reverse of the id - the start of the id is "time"
    // so reversing it gets you the random stuff at the front of the string
    const ida = reverseString(a.id)
    const idb = reverseString(b.id)
    if (ida < idb) return -1
    if (ida > idb) return 1
    return 0
  })

  // boxjam
  const container = { width: opts.width, height: opts.height }
  const adjustedRectangles = boxjam(rectangles, container, opts.margin, opts.center).concat(hiddenParts)

  // construct output JSON
  const output = {
    song_id: song.id,
    output: {
      size: [opts.width, opts.height],
      reverb: opts.reverb,
      reverb_type: opts.reverbType,
      panning: opts.panning,
      watermark: opts.watermark
    },
    inputs: adjustedRectangles.map((r) => {
      // calculate stereo pan from where the middle of the video overlay
      // pan goes from -1 (left) to 0 (centre) to 1 (right)
      const retval = {
        part_id: r.id,
        size: [r.width, r.height],
        volume: r.volume,
        offset: partMap[r.id].offset
      }
      // if an 'x' coordinate is present, the video is visible and needs
      // to be positioned and possibly have audio panned left/right
      if (typeof r.x !== 'undefined') {
        retval.position = [Math.floor(r.x), Math.floor(r.y)]
        if (opts.panning) {
          retval.pan = (2 * ((r.x + r.width / 2) / opts.width) - 1)
        }
      }
      return retval
    })
  }

  // organise the "inputs" into slices, where each slice is collection
  // of videos that have the same y coordinate. We will process the
  // video later in the pipeline grouped into these slices
  output.runbook = generateRunbook(output.inputs)
  return output
}


// find top and bottom limits from a list of videos
const calcBoundingBox = (specs) => {
  let top = 1000000.0
  let bottom = -1000000.0
  for (const i in specs) {
    const spec = specs[i]
    if (!spec.position) continue
    const y = spec.position[1]
    const height = Math.floor(spec.size[1] / 2) * 2
    if (y < top) {
      top = y
    }
    if (y + height > bottom) {
      bottom = y + height
    }
  }
  return { top, bottom }
}


// build the filter graph for processing audio & video
const buildComplexVideoFilter = (videos, outputWidth, outputHeight) => {
  // complex filter
  const filters = []
  let f
  for (const i in videos) {
    const video = videos[i]
    video.id = i.toString()

    // video pipeline
    const offset = parseInt(video.offset || '0') / 1000
    f = {
      inputs: video.id + ':v',
      filter: 'trim',
      options: {
        start: offset
      },
      outputs: 'a' + video.id
    }
    filters.push(f)
    f = {
      inputs: 'a' + video.id,
      filter: 'setpts',
      options: 'PTS-STARTPTS',
      outputs: 'b' + video.id
    }
    filters.push(f)
    f = {
      inputs: 'b' + video.id,
      filter: 'scale',
      options: {
        width: video.size[0],
        height: video.size[1],
        force_original_aspect_ratio: 'decrease',
        force_divisible_by: 2
      },
      outputs: 'c' + video.id
    }
    filters.push(f)
  }

  // if we only have one video
  if (videos.length === 1) {
    // pad the video
    f = {
      inputs: 'c0',
      filter: 'pad',
      options: {
        width: outputWidth,
        height: outputHeight,
        x: videos[0].position[0],
        y: videos[0].position[1]
      },
      outputs: 'e0'
    }
    filters.push(f)
  } else {
    const inputs = []

    // stack the videos into one
    // construct an array of inputs
    for (const i in videos) {
      inputs.push('c' + i)
    }
    f = {
      inputs: inputs,
      filter: 'xstack',
      options: {
        inputs: videos.length,
        fill: 'black',
        layout: calcLayout(videos)
      },
      outputs: 'd0'
    }
    filters.push(f)
    f = {
      inputs: 'd0',
      filter: 'pad',
      options: {
        width: outputWidth,
        height: outputHeight
      },
      outputs: 'e0'
    }
    filters.push(f)
  }

  // add our filter graph to the command
  return {
    filters: filters,
    outputs: ['e0']
  }
}

const calcLayout = (specs) => {
  let layout = ''
  for (const i in specs) {
    const spec = specs[i]
    if (layout) {
      layout += '|'
    }
    layout += `${spec.position[0]}_0`
  }
  return layout
}

// build the filter graph for processing audio & video
const buildComplexAudioFilter = (videos) => {
  // complex filter
  const filters = []
  const videosWithAudio = []
  let f
  for (const i in videos) {
    const video = videos[i]
    video.id = i.toString()
    const offset = parseInt(video.offset || '0') / 1000
    if (video.volume > 0) {
      videosWithAudio.push(video)
      // audio pipeline
      f = {
        inputs: video.id + ':a',
        filter: 'atrim',
        options: {
          start: offset
        },
        outputs: 'm' + video.id
      }
      filters.push(f)
      f = {
        inputs: 'm' + video.id,
        filter: 'asetpts',
        options: 'PTS-STARTPTS',
        outputs: 'n' + video.id
      }
      filters.push(f)
      f = {
        inputs: 'n' + video.id,
        filter: 'volume',
        options: video.volume.toString(), // ffmpeg expects string parameters and numeric 0 causes problems
        outputs: 'o' + video.id
      }
      filters.push(f)
      f = {
        inputs: 'o' + video.id,
        filter: 'stereotools',
        options: {
          mpan: video.pan
        },
        outputs: 'p' + video.id
      }
      filters.push(f)
    }
  }

  // if we have no videos with sound, then we're done
  if (filters.length === 0) {
    // if we arrived here we have no audio to work with so generate a silent
    // audio track to avoid breaking the pipeline further downstream
    f = {
      filter: 'anullsrc',
      options: {
        channel_layout: 'stereo',
        sample_rate: '44100',
        duration: '1' // if omitted, duration is infinite :o
      },
      outputs: 'q0'
    }
    return { filters: [f], outputs: ['q0'] }
  }

  // if we only have one video
  if (videosWithAudio.length === 1) {
    // do nothing to the audio - just map p0->q0
    f = {
      inputs: 'p' + videosWithAudio[0].id,
      filter: 'volume',
      options: '1',
      outputs: 'q0'
    }
    filters.push(f)
  } else {
    const inputs = []

    // stack the videos into one
    // construct an array of input
    // mix the audio into one
    const ainputs = []
    for (const i in videosWithAudio) {
      ainputs.push('p' + videosWithAudio[i].id)
    }
    f = {
      inputs: ainputs,
      filter: 'amix',
      options: {
        inputs: ainputs.length
      },
      outputs: 'q0'
    }
    filters.push(f)
  }

  // add our filter graph to the command
  return {
    filters: filters,
    outputs: ['q0']
  }
}

async function renderRow(recipe, sliceId) {
  const videos = recipe.runbook.slices[sliceId]
  console.log('videos', videos)
  const boundingBox = calcBoundingBox(videos)
  const outputWidth = recipe.output.size[0]
  const outputHeight = boundingBox.bottom - boundingBox.top + 10 // margin of 10 between rows

  // calculate path for each video
  const command = ffmpeg()
  for (const video of videos) {
    // calculate path/url of video
    const partURL = path.join('..', 'videos', recipe.song_id, video.part_id.toString() + '_converted.nut')
    video.url = partURL
    command.addInput(video.url)
      .inputOptions([ '-r 25', '-thread_queue_size 64'])
  }

  // build the video & audio pipelines
  const complexVideoFilter = buildComplexVideoFilter(videos, outputWidth, outputHeight)
  const complexAudioFilter = buildComplexAudioFilter(videos)
  command.complexFilter(
    complexVideoFilter.filters.concat(complexAudioFilter.filters),
    complexVideoFilter.outputs.concat(complexAudioFilter.outputs))

  const outPath = path.join('..', 'videos', recipe.song_id, `slice_${sliceId}.nut`)
  command
    .output(outPath)
    .outputFormat('nut') // nut container
    .outputOptions([
      '-pix_fmt yuv420p',
      '-acodec pcm_s16le', // PCM audio
      '-vcodec mpeg2video', // mpeg2video video
      //        '-preset fast', // fast
      '-r 25', // 25 fps
      '-qscale 1', // defines the video quality from 1-31, with 1 being the best. 
      '-qmin 1'])
  await run(command, true)
}


// build the filter graph for processing audio & video
const buildComplexFilter = (videos) => {
  // complex filter
  const filters = []
  const vparts = []
  const aparts = []
  let f
  for (const i in videos) {
    const video = videos[i]
    video.id = i.toString()

    // audio only videos are on row -1
    if (video.rowNum !== '-1') {
      vparts.push(video.id + ':v')
    }
    aparts.push(video.id + ':a')
  }
  // if there is only one video row, then we can't use vstack
  // because it won't work with 1 input. So we use "copy" which
  // does nothing but copy 0:v -> v.
  if (vparts.length === 1) {
    f = {
      inputs: '0:v',
      filter: 'copy',
      options: {},
      outputs: 'v'
    }
    filters.push(f)
  } else {
    // video pipeline
    f = {
      inputs: vparts,
      filter: 'vstack',
      options: {
        inputs: vparts.length
      },
      outputs: 'v'
    }
    filters.push(f)
  }
  f = {
    inputs: aparts,
    filter: 'amix',
    options: {
      inputs: aparts.length,
      dropout_transition: 180

    },
    outputs: 'a'
  }
  filters.push(f)
  return {
    filters: filters,
    outputs: ['v', 'a']
  }
}

async function renderFinal(recipe) {

  // get list of run ids
  const rows = recipe.runbook.rows
  let rowCount = 0
  const videos = recipe.runbook.rows.map((r) => {
    const obj = {
      rowNum: rowCount++,
      runId: r,
      path: path.join('..', 'videos', recipe.song_id, `slice_${r}.nut`)
    }
    return obj
  })

  // build ffmpeg command
  const command = ffmpeg()

  // add the inputs
  for (const i in rows) {
    command.addInput(videos[i].path)
      .inputOptions([ '-thread_queue_size 64'])
  }

  // build the video & audio pipelines
  const complexFilter = buildComplexFilter(videos)
  command.complexFilter(complexFilter.filters, complexFilter.outputs)

  // create temporary directory
  const outPath = path.join('..', 'videos', recipe.song_id, `final.nut`)

  // set output parameters
  command
    .output(outPath)
    .outputFormat('nut') // nut container
    .outputOptions([
      '-pix_fmt yuv420p',
      '-acodec pcm_s16le', // PCM audio
      '-vcodec mpeg2video', // mpeg2video video
      //        '-preset fast', // fast
      '-r 25', // 25 fps
      '-qscale 1', // defines the quality of the video, from 1-31  with 1 being highest quality
      '-qmin 1'])
  await run(command, true)
}


// build the filter graph for processing audio & video
const buildMasterComplexFilter = (outputWidth, outputHeight, reverbLevel) => {
  // there are three inputs
  // 0 - the input video & audio
  // 1 - the watermark
  // 2 - the reverb impulse response wav
  // complex filter
  const filters = []
  let f

  // video pipeline
  f = {
    inputs: '0:v',
    filter: 'pad',
    options: {
      x: -1,
      y: -1,
      width: outputWidth,
      height: outputHeight
    },
    outputs: 'v1'
  }
  filters.push(f)
  f = {
    inputs: ['v1', '1'],
    filter: 'overlay',
    options: {
      x: 'W-w-20',
      y: 'H-h-20'
    },
    outputs: 'video'
  }
  filters.push(f)

  // audio pipeline
  f = {
    inputs: '0:a', // audio on the main video
    filter: 'asplit',
    options: {},
    outputs: ['a1', 'a2']
  }
  filters.push(f)
  f = {
    inputs: ['a1', '2'], // audio+ reverb impulse response
    filter: 'afir',
    options: {
      dry: 10,
      wet: 10
    },
    outputs: ['reverb']
  }
  filters.push(f)
  f = {
    inputs: ['a2', 'reverb'], // reverb + original audio split
    filter: 'amix',
    options: {
      inputs: 2,
      dropout_transition: 180,
      weights: `${1 - reverbLevel} ${reverbLevel}`
    },
    outputs: ['audiomix']
  }
  filters.push(f)

  // return the list of filters and the main audio & video outputs
  return {
    filters: filters,
    outputs: ['video', 'audiomix']
  }
}

async function postProduction(recipe) {
  console.log('post_production')

  // calculate input urls for video file and watermark image
  const geturl = path.join('..', 'videos', recipe.song_id, 'final.nut')
  const reverbFile = `${recipe.output.reverb_type}.wav`
  const watermarkFile = 'choirless_watermark.png'

  // build ffmpeg command
  const command = ffmpeg()
    .addInput(geturl)
    .addInput(watermarkFile)
    .addInput(reverbFile)

  // build the video & audio pipelines
  const complexFilter = buildMasterComplexFilter(
    recipe.output.size[0], // width of output video
    recipe.output.size[1], // height of output video
    recipe.output.reverb)
  command.complexFilter(complexFilter.filters, complexFilter.outputs)

  // create temporary directory
  const outpath = path.join('..', 'videos', recipe.song_id, 'final.mp4')

  // set output parameters
  command
    .output(outpath)
    .outputFormat('mp4') // mp4 container
    .outputOptions([
      '-pix_fmt yuv420p',
      '-vcodec libx264', // h.264 video
      '-preset veryfast', // fast encoding
      '-movflags +faststart']) // put meta data at the start of the file

  await run(command, true)
}

async function masterAudio(recipe) {
  console.log('master_audio')
  const masterAudioPath = path.join('..', 'videos', recipe.song_id, 'masteraudio.wav')
  if (!fs.existsSync(masterAudioPath)) {
    console.error('Master audio does not exist', masterAudioPath)
    return
  }
  const geturl = path.join('..', 'videos', recipe.song_id, 'final.mp4')
  const outpath = path.join('..', 'videos', recipe.song_id, 'audiomaster.mp4')

  // ffmpeg -i video.mp4 -i audio.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac output.mp4
  const params = [
    '-i', geturl,
    '-i', masterAudioPath,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-y', outpath
  ]
  const execFile = util.promisify(require('node:child_process').execFile)
  const { stdout, stderr } = await execFile('ffmpeg', params)
  console.log(stdout)
  console.error(stderr)
}


async function main() {
  // load the song meta
  const song = JSON.parse(fs.readFileSync('./song.json'))

  // convert all the song parts to .nut
  for (const part of song.tracks) {
    const vid = path.join('..', 'videos', part.songId, part.partId + '.webm')
    await convertFormat(vid)
    const offset = part.offset.toFixed(0) / 1000
    await stripAudio(vid, offset)
  }

  // create render recipe
  const recipe = await render(song)

  // render each row in the recipe
  for (const row of recipe.runbook.rows) {
    console.log('Rendering row', row)
    await renderRow(recipe, row)
  }

  // combine rows
  await renderFinal(recipe)

  // post production
  await postProduction(recipe)

  // optionally add master audio
  await masterAudio(recipe)
}
main()

//stripAudio('../videos/1767801950583/1768318213747.webm', 2.0)
// const song = JSON.parse(fs.readFileSync('./song.json'))
// render(song)
//convertFormat('../videos/1767801950583/1768318213747.webm')
//const recipe = JSON.parse(fs.readFileSync('recipe.json'))
//renderRow(recipe,"10")
//renderFinal(recipe)
//postProduction(recipe)

const { ipcRenderer } = require('electron')
const getListButton = document.querySelector('#videoSelectBtn')
const startButton = document.querySelector('#startBtn')
const stopButton = document.querySelector('#stopBtn')

let recorder;
const recordedChunks = [];

getListButton.addEventListener('click', () => {
  ipcRenderer.send('list')
})

startButton.addEventListener('click', () => {
  if (!recorder) return;
  recorder.start()
  startButton.classList.add('disabled')
  stopButton.classList.remove('disabled')
})

stopButton.addEventListener('click', () => {
  if (!recorder) return;
  recorder.stop()
  startButton.classList.remove('disabled')
  stopButton.classList.add('disabled')
})

ipcRenderer.on('sources', (event, sources) => {
  document.querySelector('#sources').innerHTML = ''

  for (const source of sources) {
    const item = document.createElement('img')
    item.classList.add('source')
    item.src = source.thumbnail.toDataURL()
    document.querySelector('#sources').appendChild(item)

    item.addEventListener('click', () => {
      event.sender.send('selected', source)
    })
  }

})

ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1920,
          maxWidth: 1920,
          minHeight: 1080,
          maxHeight: 1080
        }
      }
    })
    handleStream(stream)
  } catch (e) {
    handleError(e)
  }
})

function handleStream(stream) {
  const video = document.querySelector('video')
  video.srcObject = stream
  video.onloadedmetadata = (e) => video.play()
  const options = { mimeType: 'video/webm; codecs=vp9' };
  if (!recorder) recorder = new MediaRecorder(video.srcObject, options);

  recorder.ondataavailable = handleDataAvailable;
  recorder.onstop = handleStop;

}

function handleError(e) {
  console.log(e)
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/mp4; codecs=h264'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  ipcRenderer.send('save', buffer)   

}
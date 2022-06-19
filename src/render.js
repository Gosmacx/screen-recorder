const { ipcRenderer } = require('electron')
const getListButton = document.querySelector('#videoSelectBtn')
const startButton = document.querySelector('#startBtn')
const stopButton = document.querySelector('#stopBtn')
const timeText = document.querySelector('#time')

let recorder;
let startTime;
let timer;
const recordedChunks = [];

getListButton.addEventListener('click', () => {
  ipcRenderer.send('list')
})

function t(a) {
  return a.toString().length == 1 ? '0' + a : a
}

startButton.addEventListener('click', () => {
  if (!recorder) return;
  startTime = Date.now();
  timer = setInterval(() => {
    const time = new  Date(Date.now() - startTime)
    const hours = Math.floor(time / (1000 * 60 * 60))
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    timeText.innerHTML = `${t(hours)}:${t(minutes)}:${t(seconds)}`;
  });
  recorder.start()
  startButton.classList.add('disabled')
  stopButton.classList.remove('disabled')
})

stopButton.addEventListener('click', () => {
  if (!recorder) return;
  recorder.stop()
  clearInterval(timer)
  timer = null
  timeText.innerHTML = '00:00:00'
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
import { analyze } from "web-audio-beat-detector"
import { guess } from "web-audio-beat-detector"
import "./style.css"

const audioContext = new AudioContext()
audioContext.resume()

console.log("audio is starting up ...")

const BUFF_SIZE_RENDERER = 16384

let microphoneStream = null
let gainNode = null
let scriptProcessorNode = null
let scriptProcessorAnalysisNode = null
let analyserNode = null

if (!navigator.getUserMedia)
	navigator.getUserMedia =
		navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia

if (navigator.getUserMedia) {
	navigator.getUserMedia(
		{ audio: true },
		(stream) => {
			startMicrophone(stream)
		},
		(e) => {
			alert("Error capturing audio.")
		},
	)
} else {
	alert("getUserMedia not supported in this browser.")
}

// ---

const showSomedata = (given_typed_array, num_row_to_display, label) => {
	const size_buffer = given_typed_array.length
	let index = 0

	console.log(`____${label}______`)

	if (label === "time") {
		for (; index < num_row_to_display && index < size_buffer; index += 1) {
			const curr_value_time = given_typed_array[index] / 128 - 1.0
			console.log(curr_value_time)
		}
	} else if (label === "frequency") {
		for (; index < num_row_to_display && index < size_buffer; index += 1) {
			console.log(given_typed_array[index])
		}
	} else {
		throw new Error("ERROR - must pass time or frequency")
	}
}

const processMicrophoneBuffer = (event) => {
	const microphone_output_buffer = event.inputBuffer.getChannelData(0) // just mono - 1 channel for now
}

const startMicrophone = (stream) => {
	gainNode = audioContext.createGain()
	gainNode.connect(audioContext.destination)

	microphoneStream = audioContext.createMediaStreamSource(stream)
	microphoneStream.connect(gainNode)

	scriptProcessorNode = audioContext.createScriptProcessor(
		BUFF_SIZE_RENDERER,
		1,
		1,
	)
	scriptProcessorNode.onaudioprocess = processMicrophoneBuffer

	microphoneStream.connect(scriptProcessorNode)

	// --- setup FFT

	scriptProcessorAnalysisNode = audioContext.createScriptProcessor(2048, 1, 1)
	scriptProcessorAnalysisNode.connect(gainNode)

	analyserNode = audioContext.createAnalyser()
	analyserNode.smoothingTimeConstant = 0
	analyserNode.fftSize = 2048

	microphoneStream.connect(analyserNode)

	analyserNode.connect(scriptProcessorAnalysisNode)

	const bufferLength = analyserNode.frequencyBinCount

	const arrayFreqDomain = new Uint8Array(bufferLength)
	const arrayTimeDomain = new Uint8Array(bufferLength)

	console.log(`buffer length ${bufferLength}`)

	scriptProcessorAnalysisNode.onaudioprocess = () => {
		console.log("test")
		// get the average for the first channel
		analyserNode.getByteFrequencyData(arrayFreqDomain)
		analyserNode.getByteTimeDomainData(arrayTimeDomain)

		// draw the spectrogram
		if (microphoneStream.playbackState === microphoneStream.PLAYING_STATE) {
			showSomedata(arrayFreqDomain, 5, "frequency")
			showSomedata(arrayTimeDomain, 5, "time") // store this to record to aggregate buffer/file
		}
	}
}

"use strict";
let bats;
let log = console.log.bind(console),
    id = val => document.getElementById(val),
    ul = id("ul"),
    gUMbtn = id("gUMbtn"),
    start = id("start"),
    stop = id("stop"),
    stream,
    recorder,
    counter = 1,
    chunks,
    media;

gUMbtn.onclick = e => {
    let mv = id("mediaVideo"),
        mediaOptions = {
            video: {
                tag: "video",
                type: "video/webm",
                ext: ".mp4",
                gUM: { video: true, audio: true }
            },
            audio: {
                tag: "audio",
                type: "audio/ogg",
                ext: ".ogg",
                gUM: { audio: true }
            }
        };
    media = mediaOptions.audio;
    navigator.mediaDevices
        .getUserMedia(media.gUM)
        .then(_stream => {
            stream = _stream;
            id("gUMArea").style.display = "none";
            id("btns").style.display = "inherit";
            start.removeAttribute("disabled");
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                chunks.push(e.data);
                if (recorder.state == "inactive") makeLink();
            };
        })
        .catch(log);
};

start.onclick = e => {
    start.disabled = true;
    stop.removeAttribute("disabled");
    chunks = [];
    recorder.start();
};

stop.onclick = e => {
    stop.disabled = true;
    recorder.stop();
    start.removeAttribute("disabled");
};

async function makeLink() {
    let blob = new Blob(chunks, { type: media.type }),
        url = URL.createObjectURL(blob),
        li = document.createElement("li"),
        mt = document.createElement(media.tag),
        hf = document.createElement("a");
    mt.controls = true;
    mt.src = url;
    hf.href = url;
    hf.download = `${counter++}${media.ext}`;
    hf.innerHTML = `download ${hf.download}`;
    li.appendChild(mt);
    li.appendChild(hf);
    ul.appendChild(li);
    createBuffers(url);
}

function createBuffers(url) {
    // Fetch Audio Track via AJAX with URL
    var request = new XMLHttpRequest();

    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function (ajaxResponseBuffer) {
        // Create and Save Original Buffer Audio Context in 'originalBuffer'
        var audioCtx = new AudioContext();
        var songLength = ajaxResponseBuffer.total;

        // Arguments: Channels, Length, Sample Rate
        var offlineCtx = new OfflineAudioContext(1, songLength, 44100);
        var source = offlineCtx.createBufferSource();
        var audioData = request.response;
        audioCtx.decodeAudioData(
            audioData,
            function (buffer) {
                window.originalBuffer = buffer.getChannelData(0);
                source = offlineCtx.createBufferSource();
                source.buffer = buffer;

                // Create a Low Pass Filter to Isolate Low End Beat
                var filter = offlineCtx.createBiquadFilter();
                filter.type = "lowpass";
                filter.frequency.value = 140;
                source.connect(filter);
                filter.connect(offlineCtx.destination);

                // Schedule start at time 0
                source.start(0);

                // Render this low pass filter data to new Audio Context and Save in 'lowPassBuffer'
                offlineCtx.startRendering().then(function (lowPassAudioBuffer) {
                    var audioCtx = new (window.AudioContext ||
                        window.webkitAudioContext)();
                    var song = audioCtx.createBufferSource();
                    song.buffer = lowPassAudioBuffer;
                    song.connect(audioCtx.destination);

                    // Save lowPassBuffer in Global Array
                    bats = song.buffer.getChannelData(0);
                    song.start();
                    // play.onclick = function() {
                    //   song.start();
                    // };
                    window.lowPassBuffer = getClip(10, 10, bats);
                    window.lowPassBuffer = getSampleClip(window.lowPassBuffer, 300);
                    window.lowPassBuffer = normalizeArray(window.lowPassBuffer);
                    var final_tempo = countFlatLineGroupings(window.lowPassBuffer);

                    final_tempo = final_tempo * 6;
                    console.log("Tempo: " + final_tempo);
                    document.getElementById("tempo").innerHTML = "BPM:" + final_tempo;
                });
            },
            function (e) { }
        );
    };
    request.send();
}

function getClip(length, startTime, data) {
    var clip_length = length * 44100;
    var section = startTime * 44100;
    var newArr = [];

    for (var i = 0; i < clip_length; i++) {
        newArr.push(data[startTime + i]);
    }

    return newArr;
}

function getSampleClip(data, samples) {
    var newArray = [];
    var modulus_coefficient = Math.round(data.length / samples);

    for (var i = 0; i < data.length; i++) {
        if (i % modulus_coefficient == 0) {
            newArray.push(data[i]);
        }
    }
    return newArray;
}

function normalizeArray(data) {
    var newArray = [];

    for (var i = 0; i < data.length; i++) {
        newArray.push(Math.abs(Math.round((data[i + 1] - data[i]) * 1000)));
    }

    return newArray;
}

function countFlatLineGroupings(data) {
    var groupings = 0;
    var newArray = normalizeArray(data);

    function getMax(a) {
        var m = -Infinity,
            i = 0,
            n = a.length;

        for (; i != n; ++i) {
            if (a[i] > m) {
                m = a[i];
            }
        }
        return m;
    }

    function getMin(a) {
        var m = Infinity,
            i = 0,
            n = a.length;

        for (; i != n; ++i) {
            if (a[i] < m) {
                m = a[i];
            }
        }
        return m;
    }

    var max = getMax(newArray);
    var min = getMin(newArray);
    var count = 0;
    var threshold = Math.round((max - min) * 0.2);

    for (var i = 0; i < newArray.length; i++) {
        if (
            newArray[i] > threshold &&
            newArray[i + 1] < threshold &&
            newArray[i + 2] < threshold &&
            newArray[i + 3] < threshold &&
            newArray[i + 6] < threshold
        ) {
            count++;
        }
    }

    return count;
}

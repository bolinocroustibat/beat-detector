import { analyze } from 'web-audio-beat-detector';

analyze(audioBuffer)
    .then((tempo) => {
        // the tempo could be analyzed
    })
    .catch((err) => {
        // something went wrong
    });

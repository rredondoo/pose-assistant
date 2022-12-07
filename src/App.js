import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import React, { useEffect, useState, useRef } from 'react';
import WebcamComponent from './webcam';
import Webcam from 'react-webcam';



// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
// https://upmostly.com/ultimate-reactjs-cheat-sheet

function App() {

  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);
  const poseEstimationInterval = useRef(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);

  // useEffect hook persist object between refreshes
  useEffect(() => {
    loadPosenet();
  }, [])

  async function loadPosenet() {

    // load the model with the specified architecture
    let model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 800, height: 600 },
      multiplier: 0.75
    });

    // save the model as part of the state of the App component
    setModel(model)
    console.log('PoseNet model loaded...')
  }

  const startPoseEstimation = () => {

    if (webcamRef &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState == 4) {

      poseEstimationInterval.current =  setInterval(() => {

        const video = webcamRef.current.video;
        const videoWidth = video.width;
        const videoHeight = video.height;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // pose estimation
        let start = new Date().getTime();
        model.estimateSinglePose(video, {
          flipHorizontal: false

        }).then(pose => {
          let end = new Date().getTime();
          console.log('Time: ' + end - start + 'ms');
          console.log('TF BACKEND: ' + tf.getBackend());
          console.log('POSE: ' + pose);
        })

      }, 1000)

      // call estimateSinglePose from the posenet model and pass the webbcam ref variable

    } else {

      console.log('webcamRef is not defined')
    }

  };

  const stopPoseEstimation = () => clearInterval(poseEstimationInterval.current);

  const handlePoseEstimation = () => {

    if (isPoseEstimation)
      stopPoseEstimation();

    else
      startPoseEstimation();

    setIsPoseEstimation(current => !current)
  };


  return (
    <div className="App">
      <header className="App-header">
        <WebcamComponent webcamRef={webcamRef}/>
        <button onClick={handlePoseEstimation}>{isPoseEstimation? 'Stop' : 'Start'}</button>
      </header>
    </div>
  );
}

export default App;

// 4. Define poseEstimationLoop as a useRef hook.

// 5. Implement the steps below in the startPoseEstimation function if the webcam is available.

// 6. Define an infinite loop, executing each 100 milliseconds
//     Use the JS function setInterval together with the poseEstimationLoop variable in order to stop or resume this loop conditionally.


// 7. Get video properties from webcamRef. You should get properties for video, videoWidth, and videoHeight. For example:
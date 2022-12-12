import logo from './logo.svg';
import './App.css';
import { Grid } from '@material-ui/core';
import React, { useEffect, useState, useRef } from 'react';

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import WebcamComponent from './webcam';
import CanvasComponent from './canvas';
import { drawKeypoints, drawSkeleton } from './utilities';
import { FACING_MODE_USER, FACING_MODE_ENVIRONMENT } from './webcam';



// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
// https://upmostly.com/ultimate-reactjs-cheat-sheet

function App() {

  const intervalTimeMS = 500;
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseEstimationInterval = useRef(null);
  const [model, setModel] = useState(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);
  const [facingMode, setFacingMode] = useState(FACING_MODE_USER);

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
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // pose estimation
        let start = new Date().getTime();
        model.estimateSinglePose(video, {
          flipHorizontal: true

        }).then(pose => {
          let end = new Date().getTime();
          let total = end - start;

          console.log('Time: ' + total + 'ms');
          // console.log('TF BACKEND: ' + tf.getBackend());

          drawCanvas(pose, videoWidth, videoHeight, canvasRef)
        });

      }, intervalTimeMS)

      // call estimateSinglePose from the posenet model and pass the webbcam ref variable

    } else {
      console.log('webcamRef is not defined:' + webcamRef)
    }

  };

  const stopPoseEstimation = () => clearInterval(poseEstimationInterval.current);

  const handlePoseEstimation = () => {

    if (isPoseEstimation){
      stopPoseEstimation();
      clearCanvas(canvasRef);
    }

    else
      startPoseEstimation();

    setIsPoseEstimation(current => !current)
  };

  const drawCanvas = (pose, videoWidth, videoHeight, canvas) => {

    const context = canvas.current.getContext('2d');
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    // extract keypoints from the pose object
    let keypoints = pose['keypoints'];
    let minConfidence = 0.5;

    drawKeypoints(keypoints, minConfidence, context);
    drawSkeleton(keypoints, minConfidence, context);
  };

  const clearCanvas = (canvas) => {
    const context = canvas.current.getContext('2d');
    const width = canvas.current.width;
    const height = canvas.current.height;

    context.clearRect(0, 0, width, height)
  };

  const handleClick = React.useCallback(() => {
    setFacingMode(prevState => prevState === FACING_MODE_ENVIRONMENT
        ? FACING_MODE_USER
        : FACING_MODE_ENVIRONMENT
  )}, []);

  return (
    <div className="App">
      <Grid container spacing={3}>
        <Grid item xs={12}>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>

        </Grid>
      </Grid>
      {/* <WebcamComponent webcamRef={webcamRef} facingMode={facingMode}/> */}
      {/* <CanvasComponent canvasRef={canvasRef}/> */}
        {/* <button className="start-button" onClick={handlePoseEstimation}>{isPoseEstimation? 'Stop' : 'Start'}</button> */}
        <button onClick={handleClick}>Switch camera</button>
    </div>
  );
}

export default App;


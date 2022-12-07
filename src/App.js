import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import React, { useEffect, useState, useRef } from 'react';
import WebcamComponent from './webcam';
import { drawKeypoints, drawSkeleton } from './utilities';
import { FACING_MODE_USER, FACING_MODE_ENVIRONMENT } from './webcam';
import Webcam from 'react-webcam';



// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
// https://upmostly.com/ultimate-reactjs-cheat-sheet

function App() {

  const intervalTimeMS = 2000;
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);
  const poseEstimationInterval = useRef(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);
  const canvasRef = useRef(null);
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
          flipHorizontal: false
        }).then(pose => {
          let end = new Date().getTime();
          let total = end - start;
          console.log('Time: ' + total + 'ms');
          console.log('TF BACKEND: ' + tf.getBackend());
          console.log('POSE: ' + pose);

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

    if (isPoseEstimation)
      stopPoseEstimation();

    else
      startPoseEstimation();

    setIsPoseEstimation(current => !current)
  };

  const drawCanvas = (pose, videoWidth, videoHeight, canvas) => {

    const context = canvas.current.getContext('2d');
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    // extract keypoints from the pose object
    let minConfidence = 0.5;

    drawKeypoints(pose['keypoints'], minConfidence, context);
    drawSkeleton(pose['keypoints'], minConfidence, context);
  };

  const canvasStyle = {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: 0,
    right: 0,
    textAlign: "center",
    zindex: 9,
    width: '100%',
    height: 600
  };

  const handleClick = React.useCallback(() => {
    setFacingMode(prevState => prevState === FACING_MODE_ENVIRONMENT
        ? FACING_MODE_USER
        : FACING_MODE_ENVIRONMENT
  )}, []);

  // return (
  //   <div className="App">
  //     <header className="App-header">
  //       <WebcamComponent webcamRef={webcamRef} facingMode={facingMode}/>
  //       <canvas ref={canvasRef} style={canvasStyle}/>
  //     </header>
  //     <div>
  //       <button onClick={handlePoseEstimation}>{isPoseEstimation? 'Stop' : 'Start'}</button>
  //       <button onClick={handleClick}>Switch camera</button>
  //     </div>
  //   </div>
  // );

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          mirrored={true}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 800,
            height: 600,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 800,
            height: 600,
          }}
        />
        <button style={{
          position: "relative",
          marginLeft: "auto",
          marginRight: "auto",
          top: 320,
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9
          }} onClick={handlePoseEstimation}>
          {isPoseEstimation ? "Stop" : "Start"}
        </button>
      </header>
    </div>
  );
}

export default App;


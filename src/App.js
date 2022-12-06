import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { useEffect, useState, useRef, useCallback } from 'react';
import WebcamComponent from './webcam';
import Webcam from 'react-webcam';



// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
// https://upmostly.com/ultimate-reactjs-cheat-sheet

function App() {

  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);

  async function loadPosenet() {

    // load the model with the specified architecture
    let model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: {width: 800, height: 600},
      multiplier: 0.75
    });

    // save the model as part of the state of the App component
    setModel(model)

    console.log('PoseNet model loaded...')
  }

  // useEffect hook persist object between refreshes
  useEffect(() => {
    loadPosenet();
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <WebcamComponent webcamRef={webcamRef}/>
      </header>
    </div>
  );
}

export default App;

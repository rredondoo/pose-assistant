import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import { useEffect, useState } from 'react';



// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet

function App() {

  const [model, setModel] = useState(null);

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
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

      </header>
    </div>
  );
}

export default App;

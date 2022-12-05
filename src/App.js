import logo from './logo.svg';
import './App.css';
// import * as tf from '@tensorflow/tfjs';

const handleRunTraining = (event) => {
  console.log('Run training');
  // const model = tf.sequential();
  // model.add(tf.layers.dense({ units: 1, inputShape: [1]}));

  // model.compile({ optimizer: tf.train.adam(0.1), loss: 'meanSquaredError' });
  // model.summary();

  // const xs = tf.tensor2d([-1.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0], [7, 1]);
  // const ys = tf.tensor2d([-3.0, -1.0, 2.0, 3.0, 5.0, 7.0, 10.0], [7, 1]);

  // doTraining(model, xs, ys).then(() => {
  //   let prediction = model.predict(tf.tensor2d([8.0], [1,1]));
  //   let res = prediction.dataSync()[0];
  //   prediction.dispose();

  //   console.log('Linear Model prediction for 8.0: ' + res);

  //   let prediction2 = model.predict(tf.tensor2d([10.0], [1,1]));
  //   let res2 = prediction2.dataSync()[0];
  //   prediction2.dispose();

  //   console.log('Linear Model prediction for 10.0: ' + res2);
  // });
};

// async function doTraining(model, xs, ys) {
//   const history =
//     await model.fit(xs, ys, {
//       epochs: 200,
//       callbacks: {
//         onEpochEnd: async (epoch, logs) => {
//           console.log("Epoch: "
//           + epoch
//           + "     Loss: "
//           + logs.loss);
//         }
//       }
//     });
//     console.log(history.params);
// }

function App() {
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

        <button onClick={handleRunTraining}>Run training</button>
      </header>
    </div>
  );
}

export default App;

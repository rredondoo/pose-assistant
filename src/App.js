import './App.css';
import { Grid, AppBar, Toolbar, Typography, Button, Card, CardContent, CardActions } from '@material-ui/core';
import { FormControl, InputLabel, NativeSelect, FormHelperText } from '@material-ui/core';
import { Snackbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState, useRef } from 'react';

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import WebcamComponent from './webcam';
import CanvasComponent from './canvas';
import AlertComponent from './alert';
import { drawKeypoints, drawSkeleton } from './utilities';
import { FACING_MODE_USER, FACING_MODE_ENVIRONMENT } from './webcam';
import { processData, exercises } from './dataProcessing';
import { runTraining } from './modelTraining';


class State {
  static Collecting = new State('collecting');
  static Waiting = new State('waiting');

  constructor(state) {
    this.name = state;
  }

  toString() {
    return this.name;
  }
}

// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
// https://upmostly.com/ultimate-reactjs-cheat-sheet

const useStyles = makeStyles((theme) => ({
  backgroundAppBar: {
    background: '#1875d2'
  },
  title: {
    flexGrow: 1,
    textAlign: 'left'
  },
  statsCard: {
    width: '250px',
    margin: '10px'
  },
  singleLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
}));

const delay = (time) => {
  return new Promise((resolve, reject) => {
    if (isNaN(time)) {
      reject(new Error('delay: not a valid number.'));
    } else {
      setTimeout(resolve, time);
    }
  });
};

function App() {
  const intervalTimeMS = 250;
  const collectTimeMs = 20000;
  const classes = useStyles();
  let state = State.Waiting;
  const windowWidth = 800; // TODO make it responsive
  const windowHeight = 600;

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseEstimationInterval = useRef(null);

  const [model, setModel] = useState(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);
  const [facingMode, setFacingMode] = useState(FACING_MODE_USER);
  const [opCollectData, setOpCollectData] = useState('inactive');
  const [snackbarDataColl, setSnackbarDataColl] = useState(false);
  const [snackbarDataNotColl, setSnackbarDataNotColl] = useState(false);
  const [dataCollect, setDataCollect] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [workoutState, setWorkoutState] = useState({
    workout: '',
    name: 'hai'
  });
  const [trainingModel, setTrainingModel] = useState(false);

  // useEffect hook persist object between refreshes
  useEffect(() => {
    loadPosenet();
  }, [])

  async function loadPosenet() {

    // load the model with the specified architecture
    let model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: windowWidth, height: windowHeight },
      multiplier: 0.75
    });

    // save the model as part of the state of the App component
    setModel(model)
    console.log('PoseNet model loaded...')
  }

  const isWebcamReady = () => {
    return(webcamRef &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4)
  };

  const startPoseEstimation = () => {

    if (isWebcamReady) {

      poseEstimationInterval.current =  setInterval(() => {

        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // console.debug('VIDEOWIDTH:  ' + videoWidth);
        // console.debug('VIDEOHEIGHT: ' + videoHeight);

        // pose estimation
        let startTime = new Date().getTime();

        // call estimateSinglePose from the posenet model and pass the webbcam ref variable
        model.estimateSinglePose(video, {
          flipHorizontal: true

        }).then(pose => {

          let endTime = new Date().getTime();
          let totalTime = endTime - startTime;

          let inputs = [];

          for (let i = 0; i < pose.keypoints.length; i++){

            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;

            // if the confidence score is less than 0.1
            // we want to set the values of x and y to 0
            // to reduce the noise in the data
            if (pose.keypoints[i].score < 0.1) {
              x = 0;
              y = 0;

            // else, normalize the x and y
            // to the range [-1, 1]
            } else {

              x = (2 * x / windowWidth) - 1;
              y = (2 * y / windowHeight) - 1;

              // console.debug('X:' + x);
              // console.debug('Y:' + y);
            }

            inputs.push(x);
            inputs.push(y);
          }

          console.log('STATE:      ' + state.toString());

          if (state == 'collecting') {
            console.log('TIME:       ' + totalTime + 'ms');
            console.log('TF BACKEND: ' + tf.getBackend());
            console.log('POSE:       ' + pose);
            console.log('WORKOUT:    ' + workoutState.workout);
            console.log('-----------------------------------------------');

            let newRawData = {xs: inputs, ys: workoutState.workout};

            rawData.push(newRawData);
            setRawData(rawData);

          }

          drawCanvas(pose, videoWidth, videoHeight, canvasRef);
        });

      }, intervalTimeMS)


    } else {
      console.log('webcamRef is not defined:' + webcamRef)
    }

  };

  const stopPoseEstimation = () => clearInterval(poseEstimationInterval.current);

  const openSnackbarDataColl = () => {
    setSnackbarDataColl(true);
  };

  const closeSnackbarDataColl = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarDataColl(false);
  };

  const openSnackbarDataNotColl = () => {
    setSnackbarDataNotColl(true);
  };

  const closeSnackbarDataNotColl = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarDataNotColl(false);
  };

  const collectData = async () => {

    setOpCollectData('active');
    await delay(3000); //

    openSnackbarDataColl();
    state = State.Collecting;

    await delay(collectTimeMs); // wait some time for data collection

    openSnackbarDataNotColl();
    state = State.Waiting;
    setOpCollectData('inactive');

  };

  const handlePoseEstimation = (input) => {

    if (input === 'COLLECT_DATA') {

      if (isPoseEstimation) {

        if (opCollectData === 'inactive') {

          setDataCollect(false); // no data collection taking place

          setIsPoseEstimation(false);
          stopPoseEstimation();
          state = State.Waiting;
          console.debug('stopped pose estimation')

        } else {
          console.debug('nothing')
        }
        clearCanvas(canvasRef);

      } else {
        setDataCollect(true);

        if (isWorkoutSelected()) {

          setIsPoseEstimation(true);
          startPoseEstimation();
          collectData();

          console.debug('started pose estimation');
        }
      }
    }
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

  const handleWorkoutSelect = (event) => {
    const name = event.target.name;
    setWorkoutState({
      ...workoutState,
      [name]: event.target.value
      // name: event.target.value
    });
  };

  const handleTrainModel = async (event) => {

    if (rawData.length > 0) {

      console.log('RAW DATA LENGTH: ' + rawData.length);

      const [trainData, valData, featuresNum] = processData(rawData);
      setTrainingModel(true);
      await runTraining(trainData, valData, featuresNum);
      setTrainingModel(false);
    }
  };

  const isWorkoutSelected = () => workoutState.workout != '';

  const isCollectButtonDisabled = () => (!isWorkoutSelected && trainingModel);

  return (
    <div className="App">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AppBar position='static' className={classes.backgroundAppBar}>
            <Toolbar variant='dense'>
              <Typography variant='h6' color='inherit' className={classes.title}>
                Pose Assistant
              </Typography>
              <Button color='inherit'>Start Workout</Button>
              <Button color='inherit'>History</Button>
              <Button color='inherit'>Reset</Button>
            </Toolbar>
          </AppBar>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent >
              <WebcamComponent webcamRef={webcamRef} facingMode={facingMode} width={windowWidth} height={windowHeight} />
              <CanvasComponent canvasRef={canvasRef} width={windowWidth} height={windowHeight}/>
            </CardContent>
            <CardActions style={{justifyContent: 'center'}}>
              <Grid container spacing={0}>
                <Grid item xs={12}>
                  <Toolbar style={{justifyContent: 'center'}}>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color='textSecondary' gutterBottom>
                          Jumping Jacks
                        </Typography>
                        <Typography variant='h2' component='h2' color='secondary'>
                          75
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color='textSecondary' gutterBottom>
                          Wall-sit
                        </Typography>
                        <Typography variant='h2' component='h2' color='secondary'>
                          200
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card className={classes.statsCard}>
                      <CardContent>
                        <Typography className={classes.title} color='textSecondary' gutterBottom>
                          Lunges
                        </Typography>
                        <Typography variant='h2' component='h2' color='secondary'>
                          5
                        </Typography>
                      </CardContent>
                    </Card>
                  </Toolbar>
                </Grid>
                <Grid item xs={12} className={classes.singleLine}>
                  <FormControl required className={classes.formControl}>
                    <InputLabel htmlFor='age-native-helper'>Select workout</InputLabel>
                    <NativeSelect value={workoutState.workout} onChange={handleWorkoutSelect} inputProps={{
                      name: 'workout',
                      id: 'age-native-helper'
                    }}>
                      <option aria-label='None' value=''></option>
                      <option value={exercises[0].id}>{exercises[0].name}</option>
                      <option value={exercises[1].id}>{exercises[1].name}</option>
                      <option value={exercises[2].id}>{exercises[2].name}</option>
                    </NativeSelect>
                    <FormHelperText>Select training data type</FormHelperText>
                  </FormControl>
                  <Toolbar>
                    <Typography style={{ marginRight: 16 }}>
                      <Button onClick={() => handlePoseEstimation('COLLECT_DATA')}
                              color={isPoseEstimation ? 'secondary' : 'default'}
                              style={{ marginRight: 16 }}
                              variant='contained'
                              disabled={ isCollectButtonDisabled() }>
                        {isPoseEstimation? 'Stop' : 'Collect Data'}
                      </Button>
                      <Button onClick={() => handleTrainModel()}
                              variant='contained'
                              disabled={dataCollect}>
                        Train Model
                      </Button>
                    </Typography>
                  </Toolbar>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
        <button onClick={handleClick}>Switch camera</button>
      <Snackbar open={snackbarDataColl} autoHideDuration={5000} onClose={closeSnackbarDataColl}>
        <AlertComponent onClose={closeSnackbarDataColl} severity='info'>
          Started collecting pose data!!
        </AlertComponent>
      </Snackbar>
      <Snackbar open={snackbarDataNotColl} autoHideDuration={5000} onClose={closeSnackbarDataNotColl}>
        <AlertComponent onClose={closeSnackbarDataNotColl} severity='success'>
          Finished collecting pose data!!
        </AlertComponent>
      </Snackbar>
    </div>
  );
}

export default App;


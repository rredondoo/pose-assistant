import logo from './logo.svg';
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
import { time } from '@tensorflow/tfjs';

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
  const intervalTimeMS = 500;
  const classes = useStyles();
  let state = State.Waiting;

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseEstimationInterval = useRef(null);

  const [model, setModel] = useState(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);
  const [facingMode, setFacingMode] = useState(FACING_MODE_USER);
  const [opCollectData, setOpCollectData] = useState('inactive');
  const [snackbarDataColl, setSnackbarDataColl] = useState(false);
  const [snackbarDataNotColl, setSnackbarDataNotColl] = useState(false);

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

          console.log('STATE:   ' + state.toString());

          if (state == 'collecting') {
            console.log(workoutState.workout);
          }

          drawCanvas(pose, videoWidth, videoHeight, canvasRef)
        });

      }, intervalTimeMS)

      // call estimateSinglePose from the posenet model and pass the webbcam ref variable

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
    await delay(10000); // 10s delay

    openSnackbarDataColl();
    state = State.Collecting;

    await delay(10000); // run data collection for 10 seconds

    openSnackbarDataNotColl();
    state = State.Waiting;
    setOpCollectData('inactive');

  };

  const handlePoseEstimation = (input) => {

    if (input === 'COLLECT_DATA') {
      if (isPoseEstimation){
        if (opCollectData === 'inactive') {
          setIsPoseEstimation(current => !current);
          stopPoseEstimation();
          state = State.Waiting;
          console.debug('stopped pose estimation')
        } else {
          console.debug('nothing')
        }
        clearCanvas(canvasRef);

      } else {
        if (workoutState.workout.length > 0) {
          setIsPoseEstimation(current => !current);
          startPoseEstimation();
          collectData();
          console.debug('started pose estimation')
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

  const [workoutState, setWorkoutState] = useState({
    workout: '',
    name: 'hai'
  });

  const handleWorkoutSelect = (event) => {
    const name = event.target.name;
    setWorkoutState({
      ...workoutState,
      [name]: event.target.value
      // name: event.target.value
    });
  };

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
              <WebcamComponent webcamRef={webcamRef} facingMode={facingMode}/>
              <CanvasComponent canvasRef={canvasRef}/>
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
                    <InputLabel htmlFor='age-native-helper'>Workout</InputLabel>
                    <NativeSelect value={workoutState.workout} onChange={handleWorkoutSelect} inputProps={{
                      name: 'workout',
                      id: 'age-native-helper'
                    }}>
                      <option aria-label='None' value=''></option>
                      <option value={'JUMPING_JACKS'}>Jumping Jacks</option>
                      <option value={'WALL_SIT'}>Wall-sit</option>
                      <option value={'LUNGES'}>Lunges</option>
                    </NativeSelect>
                    <FormHelperText>Select training data type</FormHelperText>
                  </FormControl>
                  <Toolbar>
                    <Typography style={{ marginRight: 16 }}>
                      <Button onClick={() => handlePoseEstimation('COLLECT_DATA')}
                              color={isPoseEstimation ? 'secondary' : 'default'}
                              style={{ marginRight: 16 }} variant='contained'>
                        {isPoseEstimation? 'Stop' : 'Collect Data'}
                      </Button>
                      <Button variant='contained'>
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


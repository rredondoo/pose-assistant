import * as tf from '@tensorflow/tfjs';

const exercises = {
    0: {id: 'JUMPING_JACKS', name: 'Jumping Jacks'},
    1: {id: 'WALL_SIT', name: 'Wall sit'},
    2: {id: 'LUNGES', name: 'Lunges'},
  };

const oneHot = (x, y) => {

    y = [
        y === exercises[0].id ? 1 : 0,
        y === exercises[1].id ? 1 : 0,
        y === exercises[2].id ? 1 : 0
    ];

    return {xs: x, ys: y};
};

const processData = (rawData) => {

    // calculate the split size for the training
    // and validation datasets
    const split = 0.8;
    const trainSize = Math.floor(split * rawData.length);

    // shuffle the data first
    const dataShuffled = tf.data.array(rawData).shuffle(10);

    // split the data into training and validation sets
    let trainData = dataShuffled.take(trainSize);
    let valData = dataShuffled.skip(trainSize);

    // encode the target labels into one-hot incoding
    // and batch the data
    trainData = trainData.map(({x, y}) => oneHot(x, y)).batch(32);
    valData = valData.map(({x, y}) => oneHot(x, y)).batch(32);

    // posenet returns 17 keypoints
    // we need to double that amount
    const featuresNum = 2 * 17

    return [featuresNum, trainData, valData];
};

export { processData, exercises };
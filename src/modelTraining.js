import * as tf from '@tensorflow/tfjs';

const buildModel = (numFeatures, numOutputs=3) => {
    let model = tf.sequential();

    // add three layers to the model
    model.add(tf.layers.dense({units: 12, inputShape: [numFeatures], activation: 'relu'}));
    model.add(tf.layers.dense({units: 8, activation: 'relu'}));
    model.add(tf.layers.dense({units: numOutputs, activation: 'softmax'}));

    //compile the model
    model.compile({optimizer: tf.train.adam(0.001),
                    loss: 'categoricalCrossentropy',
                    metrics: 'accuracy'});

    return model;
};

const endCallback = (epoch, logs) => {
    console.log(`Epoch: ${epoch},    loss: ${logs.loss},    accuracy: ${logs.acc}`);
    console.log(`          val loss: ${logs.val_loss},      val acc: ${logs.val_acc}`);
};

const runTraining = async (data, valData, numFeatures) => {

    // const a = data.take(1);
    // await a.forEachAsync(e => console.log(e));

    let model = buildModel(numFeatures);

    const history = await model.fitDataset(data, {
        epochs: 100,
        validationData: valData,
        callbacks: { onEpochEnd: endCallback }
    });

    // indexedDB is a low level api for client-side storage
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

    const file_name = 'pose_model';
    const save_url = 'indexeddb://' + file_name;
    await model.save(save_url);
    console.log(`Model saved as ${file_name}`);
};

export { runTraining };
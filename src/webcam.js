import React, {useState, useRef} from 'react';
import Webcam from 'react-webcam';


// position: "absolute",
// marginLeft: "auto",
// marginRight: "auto",
// left: 0,
// right: 0,
// textAlign: "center",
// zindex: 9

const WebcamComponent = ({webcamRef}) => {

    const style = {
        position: 'absolute',
        marginLeft: 'auto',
        marginRight: 'auto',
        left: 0,
        right: 0,
        textAlign: 'center',
        zindex: 9,
        width: 800,
        height: 600
    };

    return (
        <Webcam ref={webcamRef}
                style={style} />
    )
};

export default WebcamComponent;
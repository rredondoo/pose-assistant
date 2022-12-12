import React, {useState, useRef} from 'react';
import Webcam from 'react-webcam';


export const FACING_MODE_USER = 'user';
export const FACING_MODE_ENVIRONMENT = 'environment';

const WebcamComponent = ({webcamRef, facingMode}) => {

    const style = {
        marginTop: '10px',
        marginBottom: '10px',
        marginLeft: 'auto',
        marginRight: 'auto',
        left: 0,
        right: 0,
        textAlign: 'center',
        zindex: 9,
        width: '100%',
        height: 600
    };

    const videoConstraints = {
        facingMode: FACING_MODE_ENVIRONMENT
    };

    return (
        <>
        <Webcam ref={webcamRef} mirrored={ true } id={'webcam'} audio={false} screenshotFormat='image/jpeg' videoConstraints={{ ...videoConstraints, facingMode}}
                style={style}/>
        </>
    )
};

export default WebcamComponent;
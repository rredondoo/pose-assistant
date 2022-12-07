import React, {useState, useRef} from 'react';
import Webcam from 'react-webcam';


// position: "absolute",
// marginLeft: "auto",
// marginRight: "auto",
// left: 0,
// right: 0,
// textAlign: "center",
// zindex: 9

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const WebcamComponent = ({webcamRef}) => {

    const [facingMode, setFacingMode] = useState(FACING_MODE_ENVIRONMENT);

    const style = {
        // position: 'absolute',
        // marginLeft: 'auto',
        // marginRight: 'auto',
        left: 0,
        right: 0,
        textAlign: 'center',
        zindex: 9,
        width: 800,
        height: 600
    };

    const videoConstraints = {
        facingMode: FACING_MODE_ENVIRONMENT
    };


    const handleClick = React.useCallback(() => {
        setFacingMode(prevState => prevState === FACING_MODE_ENVIRONMENT
            ? FACING_MODE_USER
            : FACING_MODE_ENVIRONMENT
    )}, []);

    return (
        <>
        <button onClick={handleClick}>Switch camera</button>
        <Webcam id={'webcam'} audio={false} screenshotFormat='image/jpeg' videoConstraints={{ ...videoConstraints, facingMode}}
                style={style} />
        </>
    )
};

export default WebcamComponent;
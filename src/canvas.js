const CanvasComponent = ({canvasRef}) => {

    const canvasStyle = {
        position: 'absolute',
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

    return (
        <canvas ref={canvasRef} style={canvasStyle}/>
    );
}

export default CanvasComponent;
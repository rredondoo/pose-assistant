import MuiAlert from '@material-ui/lab/Alert';


function AlertComponent(props) {
    return <MuiAlert elevation={6} variant='filled' {...props} />
}

export default AlertComponent;
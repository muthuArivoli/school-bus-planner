import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { Helmet } from 'react-helmet';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { DateTime } from 'luxon';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function StudentDetail(props) {

  let navigate = useNavigate();

  const [routes, setRoutes] = React.useState([])
  const [bus, setBus] = React.useState(null);
  const [number, setNumber] = React.useState(5000);
  const [route, setRoute] = React.useState(null);
  const [direction, setDirection] = React.useState(0);

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [busRunDialogOpen, setBusRunDialogOpen] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

 
  function tConvert(time) {
    let date_time = DateTime.fromISO(time, {zone: 'utc'});
    return date_time.setZone("America/New_York").toLocaleString(DateTime.TIME_SIMPLE);
  }

  React.useEffect(()=>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success){
          console.log(result.data.user.bus)
        if(result.data.user.bus != null) {
            result.data.user.bus.start_time = tConvert(result.data.user.bus.start_time)
        }
        setBus(result.data.user.bus);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, []) 

  React.useEffect(()=>{
    const fetchData=async()=>{
        const result = await axios.get(
            process.env.REACT_APP_BASE_URL+'/route', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            params: {sort: "name", dir: "asc"}
            }
        );
        if (result.data.success){
            let arr = result.data.routes.map((value) => {
            console.log({label: value.name, id: value.id});
            return {label: value.name, id: value.id};
            });
            setRoutes(arr);
        }
        else{
            props.setSnackbarMsg(`Users could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/users");
        }
    }
    fetchData();
  }, [])

  const handleDelete = () => {
    axios.delete(process.env.REACT_APP_BASE_URL+`/bus/${bus.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if(res.data.success) {
        props.setSnackbarMsg(`Run successfully stopped`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/users")
      }
    }).catch((err) => {
      console.log(err.response)
      console.log(err.response.status)
      console.log(err.response.headers)
    });
  }

  const handleAccept = (ignore) =>{
    let req = {
        route_id: route.id,
        number: number,
        ignore_error: ignore,
        direction: direction
    };
    console.log(req);
    axios.post(process.env.REACT_APP_BASE_URL+"/bus", req, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then(async (res) => {
        if(res.data.success){
            setConfirmDialogOpen(false);
            setBusRunDialogOpen(false);
            props.setSnackbarMsg(`Run successfully sent`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("success");
            navigate("/");
        }
        else if(res.data.error){
            setErrorMsg(res.data.msg);
            setConfirmDialogOpen(true);
        }
        else{
            console.log(res.data.msg);
        }
    });
  }   
    



  
  return (
    <>
    <Helmet>
      <title>
        {"Bus Run"}
      </title>
    </Helmet>
    <Grid container justifyContent="center" pt={5}>
    <Stack spacing={2} justifyContent="center">
        <Typography variant="h4" align="center">
                Bus Run Info
              </Typography>
        </Stack>

      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={15} justifyContent="center">
            {bus != null && 
            <>
          <Typography variant="h5" align="center">
            Number: {bus.number}
          </Typography>
          <Typography variant="h5" align="center">
            Route: {bus.route.name}
          </Typography>
          </>
            }

        </Stack>

        <Stack direction="row" spacing={15} justifyContent="center">
            {bus != null && 
            <>
          <Typography variant="h5" align="center">
            Start Time: {bus.start_time}
          </Typography>
          <Typography variant="h5" align="center">
            Direction: {bus.direction == 0 ? "To School" : "From School"}
          </Typography>
          </>
            }

        </Stack>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button
              onClick={()=>{setBusRunDialogOpen(true)}}
              color="primary"
              variant="outlined"
              size="small"
              >
              Start Bus Run
          </Button>
          {
          (bus != null) &&
          <DeleteDialog buttonDesc={"Stop Bus Run"} dialogTitle="Stop Bus Run?" dialogDesc={`Please confirm you would like to stop the bus run`} onAccept={handleDelete}/>
          }
        </Stack>
        </Stack>
    </Grid>

            
    <Dialog
        open={busRunDialogOpen}
        onClose={()=>setBusRunDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Start Bus Run?
        </DialogTitle>
        <DialogContent>
        <Grid container spacing={2}>
            <Grid item xs={12} sx={{mt: 2}}>
            <Autocomplete
            fullWidth
            options={routes}
            disabled={routes == 0}
            autoSelect
            value={route}
            onChange={(e, new_value) => setRoute(new_value)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label={"Route Name" } />}
            />
            </Grid>
            <Grid item xs={12}>
            <TextField 
            autoFocus
            required
            label="Bus Number"
            value={number}
            onChange={(e) => setNumber(e.target.value != "" ? parseInt(e.target.value) : "")}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
            </Grid>
            <Grid item xs={12}>
            <FormControl>
                <FormLabel id="role-group-label">Direction</FormLabel>
                <RadioGroup
                  aria-labelledby="role-group-label"
                  value={direction}
                  onChange={(e)=>{
                    setDirection(parseInt(e.target.value));
                  }}
                  name="role-group"
                >
                  <FormControlLabel value={0} control={<Radio />} label="To School" />
                  <FormControlLabel value={1} control={<Radio />} label="From School" />
                </RadioGroup>
                </FormControl>
            </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
        <Button onClick={()=>handleAccept(false)} disabled={number == "" || route == null}>Submit</Button>
        </DialogActions>
      </Dialog>

        
      <Dialog
        open={confirmDialogOpen}
        onClose={()=>setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          Stop existing bus run?
        </DialogTitle>
        <DialogContent>
        <DialogContentText>
            {"Error: " + errorMsg}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
        <Button onClick={()=>handleAccept(true)} disabled={number == "" || route == null}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
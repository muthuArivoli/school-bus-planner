import React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from '../DeleteDialog';
import Typography from '@mui/material/Typography';
import RouteDetailStudentList from './RouteDetailStudentList';
import RouteDetailStopList from './RouteDetailStopList';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MuiAlert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Link from '@mui/material/Link';

const containerStyle = {
  height: "400px",
  width: "500px"
};

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function RouteDetail(props) {

  let { id } = useParams();

  const [error, setError] = React.useState(false);
  const [data, setData] = React.useState({});
  const [schoolLocation, setSchoolLocation] = React.useState({lat: 0, lng:0});
  const [students, setStudents] = React.useState([]);

  const [school, setSchool] = React.useState("");
  const [rows, setRows] = React.useState([]);

  const [map, setMap] = React.useState(null);
  const [stops, setStops] = React.useState([]);
  const [stopRows, setStopRows] = React.useState([]);

  let navigate = useNavigate();

  const [role, setRole] = React.useState(0);

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
        setRole(result.data.user.role);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, []);
 
  function tConvert(time) {
    time = time.match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time.length > 1) { // If time format correct
      time = time.slice(1);  // Remove full string match value
      time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    let newTime = time.join('');
    let front = newTime.slice(0, -5);
    let back = newTime.slice(-2);
    return front+" "+back;
  }

  const handleDelete = () => {
      axios.delete(process.env.REACT_APP_BASE_URL+`/route/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then((res) => {
        if(res.data.success) {
          props.setSnackbarMsg(`Route successfully deleted`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/routes");
        }
        else {
          setError(true);
        }
      }).catch((err) => {
        console.log(err.response)
        console.log(err.response.status)
        console.log(err.response.headers)
      });
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  // update map view/zoom when students/school is changed
  React.useEffect(()=>{
    if(map){
      var bounds = new window.google.maps.LatLngBounds();
      console.log(students);
      console.log(schoolLocation);
      for (var i = 0; i < students.length; i++) {
        bounds.extend(students[i].loc);
      }
      bounds.extend(schoolLocation);
      map.fitBounds(bounds);
    }
  }, [students, schoolLocation, map]);
  
  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, [])

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/route/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.route);

        let newStops = result.data.route.stops.map((value)=>{
          return {...value, dropoff_time: tConvert(value.dropoff_time), pickup_time: tConvert(value.pickup_time), loc: {lat: value.latitude, lng: value.longitude}}
        })
        setStops(newStops);

        setSchool(result.data.route.school.name);
        setSchoolLocation({lat: result.data.route.school.latitude, lng: result.data.route.school.longitude})
        let newStopRows = [{name: result.data.route.school.name, pickup_time: tConvert(result.data.route.school.arrival_time), dropoff_time: tConvert(result.data.route.school.departure_time), id: -1}, ...newStops]
        setStopRows(newStopRows);

        console.log(result.data.route);
        let newRows = result.data.route.students.map((value)=>{
          return {...value, name: {name: value.name, id: value.id}}
        });
        setRows(newRows);

        let newStudents = result.data.route.students.map((value)=>{
          return {...value, loc: {lat: value.user.latitude, lng: value.user.longitude}}
        })
        setStudents(newStudents);
      }
      else{
        props.setSnackbarMsg(`Route could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }

    };

    fetchData();
  }, []);

  return (
    <>
    <Snackbar open={error} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error">
        Failed to delete route.
      </Alert>
    </Snackbar>
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack spacing={4} justifyContent="center">
          <Stack direction="row" spacing={4} justifyContent="center">
            <Typography variant="h5" align="center">
              Route Name: {data.name}
            </Typography>

            <Typography variant="h5" align="center">
              {"School: "} 
              <Link component={RouterLink} to={"/schools/" + data.school_id}>
                {school}
              </Link>

            </Typography>


          </Stack>

          <Typography variant="h5" align="center">
              Route Complete: {data.complete === true ? "Yes" : "No"}  
          </Typography>


          <TextField
          label="Description"
          value={data.description}
          InputProps={{
            readOnly: true,
          }}
          multiline
          focused
          />

        </Stack>

        <Stack direction="row" spacing={3} sx={{ width: '100%'}}>
        
        <LoadScript
          googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
        >
          <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad}>
            <Marker title="School" position={schoolLocation} icon="http://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png"/>
            {students.map((student, index) => (
                <Marker key={index} title={student.name} position={student.loc} icon="http://maps.google.com/mapfiles/kml/paddle/grn-circle.png"/> ))}
            {stops.map((stop, index)=> (
                <Marker key={index} title={stop.name} position={stop.loc} icon="http://maps.google.com/mapfiles/kml/paddle/red-square-lv.png"/> ))}
          </GoogleMap>
        </LoadScript>   
      <Stack spacing={1} sx={{ width: '50%'}}>
    
      <Typography variant="body1" align="center">
              Route Students
          </Typography>

        <RouteDetailStudentList rows={rows}/>
      </Stack>
    </Stack>
             
      <Stack spacing={1} sx={{ width: '100%'}}>
        <Typography variant="body1" align="center">
              Route Stop Information
          </Typography>
        <RouteDetailStopList rows={stopRows}/>
      </Stack>

        <Stack direction="row" spacing={3} justifyContent="center">
          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
              to={`/schools/${data.school_id}/routes?route=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Modify
          </Button>
          }
          {
          (role == 1 || role == 2) &&
          <DeleteDialog dialogTitle="Delete Route?" dialogDesc={`Please confirm you would like to delete route ${data.name}`} onAccept={handleDelete}/>
          }
          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
              to={`/email?route=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Email
          </Button>
          }
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
import React, { useState, useEffect } from 'react';
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

  const [error, setError] = useState(false);
  const [data, setData] = useState({});
  const [schoolLocation, setSchoolLocation] = React.useState({lat: 0, lng:0});
  const [students, setStudents] = React.useState([]);

  const [school, setSchool] = useState("");
  const [rows, setRows] = useState([]);

  const [map, setMap] = React.useState(null);
  const [stops, setStops] = useState([]);
  const [stopRows, setStopRows] = useState([]);

  let navigate = useNavigate();

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
        bounds.extend(students[i].location);
      }
      bounds.extend(schoolLocation);
      map.fitBounds(bounds);
    }
  }, [students, schoolLocation]);
  
  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, [])

//NEED TO GET STOP INFO FOR STOP DATAGRID

  useEffect(() => {
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

        let newStopRows = []; 
        for (let i=0; i < result.data.route.stops.length; i++){
          const stopRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/stop/${result.data.route.stops[i]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (stopRes.data.success){
            console.log(stopRes.data.stop)
            newStopRows = [...newStopRows, {name: stopRes.data.stop.name, id: stopRes.data.stop.id, pickup_time: stopRes.data.stop.pickup_time, dropoff_time: stopRes.data.stop.dropoff_time, loc: {lat: stopRes.data.stop.latitude, lng: stopRes.data.stop.longitude}}]
          }
          else{
            props.setSnackbarMsg(`Route could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/routes");
          }
        }

        setStops(newStopRows);

        const schoolRes = await axios.get(
          process.env.REACT_APP_BASE_URL+`/school/${result.data.route.school_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (schoolRes.data.success){
          setSchool(schoolRes.data.school.name);
          setSchoolLocation({lat: schoolRes.data.school.latitude, lng: schoolRes.data.school.longitude})
          newStopRows = [{name: schoolRes.data.school.name, id: -1, pickup_time: schoolRes.data.school.arrival_time, dropoff_time: schoolRes.data.school.departure_time }, ...newStopRows]
          setStopRows(newStopRows);
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
        }


        console.log(result.data.route);
        let newRows = [];
        let newStudents=[];
        for(let i=0; i<result.data.route.students.length; i++){
          const studentRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/student/${result.data.route.students[i]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if(studentRes.data.success){
            newRows = [...newRows, {name: {name: studentRes.data.student.name, id: result.data.route.students[i]}, id: result.data.route.students[i], in_range: studentRes.data.student.in_range}]
            const userRes = await axios.get(
              process.env.REACT_APP_BASE_URL+`/user/${studentRes.data.student.user_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
              }
            );
            if(userRes.data.success){
                console.log(userRes.data.user);
                console.log(studentRes.data);
                newStudents = [...newStudents, {name: studentRes.data.student.name, address: userRes.data.user.uaddress, location: {lat: userRes.data.user.latitude, lng: userRes.data.user.longitude}, in_range: studentRes.data.student.in_range}]
            }
            else{
                props.setSnackbarMsg(`Route could not be loaded`);
                props.setShowSnackbar(true);
                props.setSnackbarSeverity("error");
                navigate("/routes");
            }

          }
          else{
            props.setSnackbarMsg(`Route could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/routes");
          }
        }
        setRows(newRows);
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
                <Marker key={index} title={student.name} position={student.location} icon="http://maps.google.com/mapfiles/kml/paddle/grn-circle.png"/> ))}
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
          <Button component={RouterLink}
              to={`/schools/${data.school_id}/routes?route=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Route?" dialogDesc={`Please confirm you would like to delete route ${data.name}`} onAccept={handleDelete}/>
          <Button component={RouterLink}
              to={`/email?route=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Email
          </Button>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
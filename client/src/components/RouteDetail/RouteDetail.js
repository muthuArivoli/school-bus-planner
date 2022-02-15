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
import Geocode from "react-geocode";

Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

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

//const [stopLocation, setStopLocation] = useState({})
//const [stopTime,setStopTime] = useState({pickup:, dropoff: })  //pickup_time, dropoff_time
//const [inRangeStudents, setInRangeStudents] = React.useState([])
//const [routeComplete, setRouteComplete] = React.useState();

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

        const schoolRes = await axios.get(
          process.env.REACT_APP_BASE_URL+`/school/${result.data.route.school_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (schoolRes.data.success){
          setSchool(schoolRes.data.school.name);
          const g = await Geocode.fromAddress(schoolRes.data.school.address);
          const {lat, lng} = g.results[0].geometry.location;
          console.log({lat: lat, lng: lng})
          setSchoolLocation({lat: lat, lng: lng})
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
        }

        //check if student is in/out range 
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
            newRows = [...newRows, {name: studentRes.data.student.name, id: result.data.route.students[i]}]
            const userRes = await axios.get(
              process.env.REACT_APP_BASE_URL+`/user/${studentRes.data.student.user_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
              }
            );
            if(userRes.data.success){
                console.log(userRes.data.user);
                const g = await Geocode.fromAddress(userRes.data.user.uaddress);
                const {lat, lng} = g.results[0].geometry.location;
                console.log(studentRes.data);
                newStudents = [...newStudents, {name: studentRes.data.student.name, address: userRes.data.user.uaddress, location: {lat: lat, lng: lng}}]
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


            {/*route complete: 
              route start time:
              route end time: 
              stop locations:
              stop times (?): 
            */}

            <Typography variant="h5" align="center">
              School: {school}

              <Button component={RouterLink}
              to={"/schools/" + data.school_id}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View School
            </Button>

            </Typography>


          </Stack>

          <Typography variant="h5" align="center">
              Route Complete: {/*  */}
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

        {/* ||||| */}

        <Typography variant="h5" align="center">
              Route Stop Information
          </Typography>


        <RouteDetailStopList rows = {rows}/>


        
        <Typography variant="h5" align="center">
              Route Students
          </Typography>

        <RouteDetailStudentList rows={rows}/>

        <LoadScript
          googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
        >
          <GoogleMap mapContainerStyle={containerStyle} zoom={3} center={schoolLocation}>
            <Marker title="School" position={schoolLocation}/>
            {students.map((student, index) => (
                <Marker key={index} title={student.name} position={student.location} label="1"/> ))}
          </GoogleMap>
        </LoadScript>        

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/schools/" + data.school_id +"/routes"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Route?" dialogDesc="Please confirm you would like to delete this route" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
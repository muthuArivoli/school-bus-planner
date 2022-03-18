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
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { PDFExport } from "@progress/kendo-react-pdf";

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
  const pdfExportComponent = React.useRef(null);

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
    let date_time = DateTime.fromISO(time);
    return date_time.toLocaleString(DateTime.TIME_SIMPLE);
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

  const handleDownload = () => {
    if (pdfExportComponent.current) {
      pdfExportComponent.current.save();
    }
  }

  return (
    <>
    <Helmet>
      <title>
        {data.name + " - Detail"}
      </title>
    </Helmet>
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

          <Typography variant="h5" align="center">
              Description:{(data.description) ? '' : ' None'} 
          </Typography>
          {(data.description) ? <Typography variant="body2" align="center">
              {data.description}  
          </Typography> : null}

        </Stack>

        <Stack direction="row" spacing={3} sx={{ width: '100%'}}>
          <Stack spacing={2} justifyContent="center" alignItems="center">
            <LoadScript googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o">
              <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad}>
                <Marker title="School" position={schoolLocation} icon="http://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png"/>
                {students.map((student, index) => (
                    <Marker key={index} title={student.name} position={student.loc} icon="http://maps.google.com/mapfiles/kml/paddle/grn-circle.png"/> ))}
                {stops.map((stop, index)=> (
                    <Marker key={index} title={stop.name} position={stop.loc} icon="http://maps.google.com/mapfiles/kml/paddle/red-square-lv.png"/> ))}
              </GoogleMap>
            </LoadScript>
            <Button onClick={handleDownload} variant='contained'>Download Route Printout</Button>
          </Stack>
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

        <PDFExport           
          ref={pdfExportComponent}
          paperSize="Letter"
          margin={"5"}
          landscape={true}
          fileName={`${data.name} Student Roster`}
          scale={0.5}
          author="HT Five">
          <Stack spacing={10} alignItems="center" sx={{ p: 8 }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="h3" align="center">Route Name: {data.name}</Typography>
              <Typography variant="h5" align="center">School: {school}</Typography>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="15%">Name</TableCell>
                    <TableCell width="10%">Student ID</TableCell>
                    <TableCell width="20%">Address</TableCell>
                    <TableCell width="15%">Parent Name</TableCell>
                    <TableCell width="25%">Parent Email</TableCell>
                    <TableCell width="15%">Parent Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow
                      key={student.name}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell width="15%">{student.name}</TableCell>
                      <TableCell width="10%">{student.student_id}</TableCell>
                      <TableCell width="20%">{student.user.uaddress}</TableCell>
                      <TableCell width="15%">{student.user.full_name}</TableCell>
                      <TableCell width="25%">{student.user.email}</TableCell>
                      <TableCell width="15%">{student.user.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </PDFExport>

    </>
  );
}
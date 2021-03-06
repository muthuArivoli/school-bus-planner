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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

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

  const [bus, setBus] = React.useState(null);
  const [busLocation, setBusLocation] = React.useState(null);
  const [first, setFirst] = React.useState(true);

  let navigate = useNavigate();

  const [role, setRole] = React.useState(0);

  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const [navDialogOpen, setNavDialogOpen] = React.useState(false);
  const [navLists, setNavLists] = React.useState([]);
  const [revNavLists, setRevNavLists] = React.useState([]);

  const handleNavDialogClose = () => {
    setNavDialogOpen(false);
  };

  const handleNavDialogOpen = () => {
    createNavLists(stopRows, 9);
    createReverseNavLists(stopRows, 9);
    setNavDialogOpen(true);
  };

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
      if(busLocation != null){
        bounds.extend(busLocation);
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
        if (first)
        setData(result.data.route);

        let newStops = result.data.route.stops.map((value)=>{
          return {...value, dropoff_time: tConvert(value.dropoff_time), pickup_time: tConvert(value.pickup_time), loc: {lat: value.latitude, lng: value.longitude}}
        })
        setStops(newStops);

        setBus(result.data.route.bus);
        if (result.data.route.bus != null && result.data.route.bus.latitude != null && result.data.route.bus.longitude != null){
          setBusLocation({lat: result.data.route.bus.latitude, lng: result.data.route.bus.longitude})
        }
        else{
          setBusLocation(null);
        }
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
    const interval = setInterval(()=>fetchData(), 2000);
    return ()=>clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (pdfExportComponent.current) {
      pdfExportComponent.current.save();
    }
  };

  const createNavLists = (stops, chunkSize) => {
    let navLists = [];
    let count = 0;
    for (let i = 0; i < stops.length; i += chunkSize) {
      let chunk;
      console.log(i);
      if (i == 0) {
        chunk = stops.slice(i, i + chunkSize);
      }
      else {
        chunk = stops.slice(i - count, (i - count) + chunkSize);
      }
      count += 1;
      navLists.push(chunk);
    }
    console.log(navLists);
    setNavLists(navLists);
  };

  const createReverseNavLists = (stops, chunkSize) => {
    let stopsCopy = [...stops];
    let revStops = stopsCopy.reverse();

    let lists = [];
    let count = 0;
    for (let i = 0; i < revStops.length; i += chunkSize) {
      let chunk;
      console.log(i);
      if (i == 0) {
        chunk = revStops.slice(i, i + chunkSize);
      }
      else {
        chunk = revStops.slice(i - count, (i - count) + chunkSize);
      }
      count += 1;
      lists.push(chunk);
    }
    console.log(lists);
    setRevNavLists(lists);
  };

  const createNavURL = (fromSchool, schoolInRoute, stoplist) => {
    let base_url = "https://www.google.com/maps/dir/?api=1&";
    let origin = "origin="; 
    let destination = "&destination=";
    let waypoints = "&waypoints=";

    if (fromSchool) {
      if (schoolInRoute){
        origin += schoolLocation.lat;
        origin += "%2C";
        origin += schoolLocation.lng;
      } else {
        origin += stoplist[0].latitude;
        origin += "%2C";
        origin += stoplist[0].longitude;
      }

      for (var i=1;i<stoplist.length;i++) {
        if (stoplist[i+1] == null) {
          destination += (''+stoplist[i].latitude)
          destination += "%2C"
          destination += (''+stoplist[i].longitude)
        } else {
          let waypoint = "";
          waypoint += (''+stoplist[i].latitude)
          waypoint += "%2C"
          waypoint += (''+stoplist[i].longitude)
          waypoint += "%7C"
          waypoints += waypoint;
        }
      }
    }
    else {
      if (schoolInRoute){
        destination += schoolLocation.lat;
        destination += "%2C";
        destination += schoolLocation.lng;
      } else {
        destination += stoplist[stoplist.length-1].latitude;
        destination += "%2C";
        destination += stoplist[stoplist.length-1].longitude;
      }

      for (var i=0;i<stoplist.length-1;i++) {
        if (i == 0) {
          origin += (''+stoplist[i].latitude)
          origin += "%2C"
          origin += (''+stoplist[i].longitude)
        } else {
          let waypoint = "";
          waypoint += (''+stoplist[i].latitude)
          waypoint += "%2C"
          waypoint += (''+stoplist[i].longitude)
          waypoint += "%7C"
          waypoints += waypoint;
        }
      }
    }
    base_url += origin;
    base_url += destination;
    base_url += "&travelmode=driving";
    base_url += waypoints;

    return base_url;
  };

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

          <Stack direction = "row" spacing = {4} justifyContent="center">
          <Typography variant="h5" align="center">
              Route Complete: {data.complete === true ? "Yes" : "No"}  
          </Typography>

          <Typography variant="h5" align="center">
            Route In Transit: {data.in_transit === true ? "Yes" : "No"}
          </Typography>

          <Typography variant = "h5" align="center">
            Bus: {bus != null ? bus.number: "None"}
          </Typography>
          </Stack>

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
                {
                  bus != null &&
                  <Marker title={`Bus`} position={busLocation} 
                  icon={"http://maps.google.com/mapfiles/kml/shapes/bus.png"} />
                }
              </GoogleMap>
            </LoadScript>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button style={{ fontSize: '12px' }} size="small" onClick={handleDialogOpen} variant='outlined'>View Student Roster</Button>
              <Button style={{ fontSize: '12px' }} size="small" onClick={handleNavDialogOpen} variant='outlined'>View Directions</Button>
            </Stack>

            <Dialog open={navDialogOpen} onClose={handleNavDialogClose} maxWidth="xl" sx={{ disableScrollLock: true }} scroll={'paper'}>
              <DialogContent>
                <Typography variant="h6" align="center">Links for Directions</Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                    {navLists.map((navlist, index) => (
                        <TableRow
                          key={index}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>Stops {(index*9)+(1-index)} - {((index*9)+(1-index))+(navlist.length-1)}</TableCell>

                          {revNavLists.map((rlist, rindex) => (
                            ((index === rindex) ? <TableCell key={rindex}>
                              <Link href={createNavURL(false, (revNavLists[revNavLists.length-1] == rlist), rlist)} rel="noreferrer" target="_blank">Directions to School</Link>
                            </TableCell> : null)
                          ))}

                          {navLists.map((flist, findex) => (
                            ((index === findex) ? <TableCell key={findex}>
                              <Link href={createNavURL(true, (navLists[0] == flist), flist)} rel="noreferrer" target="_blank">Directions from School</Link>
                            </TableCell> : null)
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer> 
              </DialogContent>
            </Dialog>        
            
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
          <Button component={RouterLink}
              to={`/logs?route=${id}`}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Transit Logs
          </Button>
        </Stack>
      </Stack>
    </Grid>
    <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xl" sx={{ disableScrollLock: true }} scroll={'paper'}>
      <DialogContent dividers={true}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownload} variant="contained" sx={{ maxWidth: '200px' }}>Download</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
import React from 'react'
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import { Icon } from "@material-ui/core";
import ListItemText from '@mui/material/ListItemText';
import { Helmet } from 'react-helmet';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import update from 'immutability-helper';
let api_key = "AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o";


const containerStyle = {
    height: "600px",
    width: "750px",
};

const titleStyle = (size, margin) => {
  return(
    { 
      fontWeight: 'bold', 
      fontSize: size, 
      m: margin, 
    });
  };

  // const legendItem = (src, text) => {
  //   return(
  //     <ListItem disablePadding>
  //       <Icon>
  //         <img src={src} height={25} width={25}/>
  //       </Icon>
  //       <ListItemText primary={text} />
  //     </ListItem>
  //   );
  // };

const mapOptions = {
  disableDoubleClickZoom: true
};

const busColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'number', headerName: "Bus Number", width: 150},
  { field: 'driver', headerName: "Driver", flex: 1},
  { field: 'route', headerName: "Route", flex: 1},
];

function NoStudentsOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Students in Current Route</Box>
    </GridOverlay>
  );
};

// Temporary data: remove this once backend implemented
let init_busses = [
  {id: 1, number: 1, start_time: null, direction: 0, route_id: 1, route: null, user_id: 1, user: null, log_id: 1, log: null, longitude: 35.9993, latitude: -78.9337},
  {id: 2, number: 2, start_time: null, direction: 1, route_id: 1, route: null, user_id: 1, user: null, log_id: 2, log: null, longitude: 36.006, latitude: -78.91807},
  {id: 3, number: 3, start_time: null, direction: 0, route_id: 1, route: null, user_id: 1, user: null, log_id: 3, log: null, longitude: 36.004537, latitude: -78.9367},
  {id: 4, number: 4, start_time: null, direction: 1, route_id: 1, route: null, user_id: 1, user: null, log_id: 4, log: null, longitude: 35.9914, latitude: -78.92277},
];

export default function RoutePlanner(props) {
  const [busses, setBusses] = React.useState([]);

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [map, setMap] = React.useState(null);

  let { id } = useParams();
  let navigate = useNavigate();

  React.useEffect(()=>{
    setBusses(init_busses);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('5 seconds');

      // Insert actual backend call here

      //Temporary data: (remove once backend is implemented)
      let temp_busses = JSON.parse(JSON.stringify(busses));
      

      setBusses(temp_busses);

    }, 5000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(()=>{
    if(map){
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < busses.length; i++) {
        bounds.extend(busses[i].location);
      }
      map.fitBounds(bounds);
    }
  }, [busses, map]);

  // function on snackbar close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // function when address is clicked (add address to route)
  // const handleAddressClick = (student) => {
  // };

  // // function on map load-in
  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, []);

  return (
    <>
    <Helmet>
      <title>
        Status Map
      </title>
    </Helmet>
    <Stack id="container-stack" spacing={5} justifyContent="center" alignItems="center">
      <Typography variant="h2" align="center" sx={titleStyle(36, 1)}>
        Temp
      </Typography>

      <Divider id="divider" variant="fullWidth" style={{width:'100%'}}/>

      <Stack spacing={5} justifyContent="center" alignItems="center">

        <Stack id="map-stack" spacing={0} justifyContent="center" alignItems="center" sx={{ p: 2, border: 2, borderRadius: '16px', borderColor: '#dcdcdc'}}>
              <LoadScript googleMapsApiKey={api_key}>
                <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad} options={mapOptions}>
                  {busses.map((bus, index) => (
                    <Marker key={index} title={student.name} position={{ 'lng': bus.longitude, 'lat': bus.latitude }} 
                    icon={"http://maps.google.com/mapfiles/kml/shapes/bus.png"} /> ))}
                </GoogleMap>
              </LoadScript>
              <Typography variant="subtitle2" align="left" sx={{ fontSize: 12, mt: 1 }}>Click on an student to add it to the route! Click on that student again to remove it.</Typography>
              <Typography variant="subtitle2" align="left" sx={{ fontSize: 12 }}>Double click anywhere to add a stop! Click on that stop again to remove it.</Typography>
        </Stack>

        <Stack id="student-table-stack" spacing={0} justifyContent="center">
              <Typography variant="h5" align="left" sx={titleStyle(28, 1)}>
                Current Students in Route:
              </Typography>
              <div style={{ height: 350, width: 800 }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ flexGrow: 1 }}>
                    <DataGrid
                      components={{
                        NoRowsOverlay: NoStudentsOverlay,
                      }}
                      rows={busses}
                      columns={busColumns}
                      getRowId={(row) => row.id}
                      autoPageSize
                      density="compact"
                    />
                  </div>
                </div>
              </div>
        </Stack>

      </Stack>

      <Snackbar open={snackbarOpen} onClose={handleClose} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}} sx={{ width: 600 }}>
        <Alert onClose={handleClose} severity={snackbarSeverity}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Stack>
    </>
  )
} 
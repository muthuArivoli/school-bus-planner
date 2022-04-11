import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Helmet } from 'react-helmet';
import Link from '@mui/material/Link';
import axios from 'axios';
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom';
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

const mapOptions = {
  disableDoubleClickZoom: true
};

const busColumns = [
  { field: 'number', headerName: "Bus Number", width: 150, sortable: false, filterable: false},
  { field: 'user', headerName: "Driver", flex: 1, sortable: false, filterable: false,
    renderCell: (params) => (
    <Link component={RouterLink} to={"/users/" + params.value.id}>
      {params.value.full_name}
    </Link>
  )},
  { field: 'route', headerName: "Route", flex: 1, sortable: false, filterable: false,    
    renderCell: (params) => (
    <Link component={RouterLink} to={"/routes/" + params.value.id}>
      {params.value.name}
    </Link>
  )},
];

function NoBusesOverlay() {
  return (
    <GridOverlay>
      <Box sx={{ mt: 1 }}>No Buses in Transit</Box>
    </GridOverlay>
  );
};



export default function RoutePlanner(props) {
  const [busses, setBusses] = React.useState([]);

  const [map, setMap] = React.useState(null);
  const [first, setFirst] = React.useState(true);

  let [query, setQuery] = useSearchParams();
  let navigate = useNavigate();

  React.useEffect(() => {
    const interval = setInterval(async () => {
      
      let result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/bus`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success) {
        console.log(result.data.buses);
        if(interval){
          console.log("interval");
            let new_buses = result.data.buses.map((value)=>{
              return {...value, location: {lat: value.latitude, lng: value.longitude}}
            });

            if(query.get("school") != null && query.get("school").match('^[0-9]+$')){
              let schoolid = parseInt(query.get("school"));
              new_buses = new_buses.filter(value => value.route.school_id == schoolid);
            }
            
            setBusses(new_buses);
        }
      }
      else{
          props.setSnackbarMsg(`Buses could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
      }

    }, 2000);
    return () => clearInterval(interval);
    });

  React.useEffect(()=>{
    if(map && busses.length != 0){
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < busses.length; i++) {
        if(busses[i].latitude != null && busses[i].longitude != null){
          bounds.extend(busses[i].location);
        }
      }
      if(first){
        map.fitBounds(bounds);
        if(map.getZoom() > 15){
          map.setZoom(15);
        }
        setFirst(false);
      }
    }
  }, [busses, map]);

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
        Transit Status Map
      </Typography>

      <Divider id="divider" variant="fullWidth" style={{width:'100%'}}/>

      <Stack spacing={5} justifyContent="center" alignItems="center">

        <Stack id="map-stack" spacing={0} justifyContent="center" alignItems="center" sx={{ p: 2, border: 2, borderRadius: '16px', borderColor: '#dcdcdc'}}>
          <LoadScript googleMapsApiKey={api_key}>
            <GoogleMap mapContainerStyle={containerStyle} onLoad={onLoad} options={mapOptions}>
              {busses.map((bus, index) => (
                bus.longitude != null && bus.latitude!=null &&
                <Marker key={index} title={`${bus.number}`} position={bus.location} 
                icon={"http://maps.google.com/mapfiles/kml/shapes/bus.png"} /> ))}
            </GoogleMap>
          </LoadScript>
        </Stack>

        <Stack id="student-table-stack" spacing={0} justifyContent="center">
              <Typography variant="h5" align="left" sx={titleStyle(28, 1)}>
                Current Buses in Transit:
              </Typography>
              <div style={{ height: 350, width: 800 }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ flexGrow: 1 }}>
                    <DataGrid
                      components={{
                        NoRowsOverlay: NoBusesOverlay,
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
    </Stack>
    </>
  )
} 
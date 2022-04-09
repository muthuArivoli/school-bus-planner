import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { Helmet } from 'react-helmet';
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
  {id: 1, number: 1, start_time: null, direction: 0, route_id: 1, route: "r1", user_id: 1, user: "A", log_id: 1, log: null, longitude: 35.9993, latitude: -78.9337},
  {id: 2, number: 2, start_time: null, direction: 1, route_id: 1, route: "r2", user_id: 1, user: "B", log_id: 2, log: null, longitude: 36.006, latitude: -78.91807},
  {id: 3, number: 3, start_time: null, direction: 0, route_id: 1, route: "r3", user_id: 1, user: "C", log_id: 3, log: null, longitude: 36.004537, latitude: -78.9367},
  {id: 4, number: 4, start_time: null, direction: 1, route_id: 1, route: "r4", user_id: 1, user: "D", log_id: 4, log: null, longitude: 35.9914, latitude: -78.92277},
];

export default function RoutePlanner(props) {
  const [busses, setBusses] = React.useState([]);
  const [busRows, setBusRows] = React.useState([]);

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [map, setMap] = React.useState(null);

  // let { id } = useParams();
  // let navigate = useNavigate();

  React.useEffect(()=>{
    setBusses(init_busses);
    let init_bus_rows = init_busses.map((v) => {
      return {"id": v.id, "number": v.number, "driver": v.user, "route": v.route};
    });
    setBusRows(init_bus_rows);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      // console.log('5 seconds');

      // Insert actual backend call here

      //Temporary (updates busses): (remove once backend is implemented)
      updateBusses();

    }, 5000);
    return () => clearInterval(interval);
  });

  React.useEffect(()=>{
    if(map){
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < busses.length; i++) {
        bounds.extend({ lat: busses[i].longitude, lng: busses[i].latitude });
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

  // // function on map load-in
  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, []);

  //Temporary (mimics busses updating): remove when implmeneted backend
  const updateBusses = () => {
    let temp_busses = JSON.parse(JSON.stringify(busses));
  
    for (var i=0;i<temp_busses.length;i++) {
      let new_lat = temp_busses[i]["latitude"] + 0.002;
      let new_lng = temp_busses[i]["longitude"] + 0.002;
      
      temp_busses[i]["latitude"] = new_lat;
      temp_busses[i]["longitude"] = new_lng;
    }
    setBusses(temp_busses);

    let new_bus_rows = temp_busses.map((v) => {
      return {"id": v.id, "number": v.number, "driver": v.user, "route": v.route};
    });
    setBusRows(new_bus_rows);
  };

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
                <Marker key={index} title={bus.number+""} position={{ lat: bus.longitude, lng: bus.latitude }} 
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
                      rows={busRows}
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
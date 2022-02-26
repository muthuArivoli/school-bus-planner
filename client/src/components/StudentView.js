import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import { GridOverlay, DataGrid } from '@mui/x-data-grid';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function StudentDetail() {

  let api_key = "AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o";

  const containerStyle = {
    height: "400px",
    width: "500px",
};

const mapOptions = {
  disableDoubleClickZoom: true
};

  let { id } = useParams();
  let navigate = useNavigate();
  const [data, setData] = React.useState({});
  const [school, setSchool] = React.useState({});
  const [user, setUser] = React.useState({});
  const [route, setRoute] = React.useState({name: "No Route", description: ""});
  const [stopRows, setStopRows] = React.useState([]);

  const stopColumns = [
    { field: 'id', hide: true, width: 30},
    { field: 'name', headerName: "Stop Name", width: 150},
    { field: 'pickup', headerName: "Pickup Time", type: 'dateTime', flex: 1},
    { field: 'dropoff', headerName: "Dropoff Time", type: 'dateTime', flex: 1},
  ];

  function NoStopsOverlay() {
    return (
      <GridOverlay>
        <Box sx={{ mt: 1, color: 'red'}}>No Stops in Current Route</Box>
      </GridOverlay>
    );
  }

  React.useEffect(() => {
    const fetchData = async() => {
      try {
        const result = await axios.get(
          process.env.REACT_APP_BASE_URL+`/current_user/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (result.data.success){
          setData(result.data.student);
          setSchool(result.data.student.school);
          setUser(result.data.student.user);
          if(result.data.student.route == null){
            setRoute({name: "No Route", description: ""});
          }
          else {
            setRoute(result.data.student.route);
            let newStopRows = [];
            for (let i=0;i<result.data.in_range_stops.length;i++) {
              let cur_stop = result.data.in_range_stops[i];
              newStopRows = [...newStopRows, {id: cur_stop.pickup_time, name: cur_stop.name, pickup: cur_stop.pickup_time, dropoff: cur_stop.dropoff_time, location: {lat: cur_stop.latitude, lng: cur_stop.longitude}}]
            }
            setStopRows(newStopRows);
          }
        }
        else {
          navigate("/")
        }
      } catch (e) {
        navigate("/")
      }
    };
    fetchData();
  }, []);

  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4}>
        <Typography variant="h5" align="center">Name: {data.name}</Typography>
        <Typography variant="h5" align="center">ID: {data.student_id}</Typography>
          <Typography variant="h5" align="center">School Name: {school.name}</Typography>
          <Typography variant="h5" align="center">School Address: {school.address}</Typography>
          <Typography variant="h5" align="center">Route Name: {route.name}</Typography>

          {
            route.name != "No Route" &&
        <Typography variant="h5" align="center">Route Description: {route.description}</Typography>
          }

          <Stack spacing={0} justifyContent="center">
            <Typography variant="h5" align="center">
              Stops in range of you: 
            </Typography>
            <Stack direction="row" spacing={3} justifyContent="center">
              <div style={{ height: 250, width: 800 }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ flexGrow: 1 }}>
                    <DataGrid
                      components={{
                        NoRowsOverlay: NoStopsOverlay,
                      }}
                      rows={stopRows}
                      columns={stopColumns}
                      getRowId={(row) => row.id}
                      autoPageSize
                      density="compact"
                    />
                  </div>
                </div>
              </div>
              <LoadScript googleMapsApiKey={api_key}>
                <GoogleMap mapContainerStyle={containerStyle} options={mapOptions} center={{lat: user.latitude, lng: user.longitude }} zoom={15}>
                  <Marker key={0} title={user.uaddress} position={{ lat: user.latitude, lng: user.longitude }} icon={{url: "http://maps.google.com/mapfiles/kml/paddle/blu-circle.png" }}/>
                  {stopRows.map((stop, index) => (
                    <Marker key={index} title={stop.name} position={stop.location} 
                    icon={{url: "http://maps.google.com/mapfiles/kml/paddle/red-square-lv.png"}}/>))} 
                </GoogleMap>
              </LoadScript>
            </Stack>
          </Stack>

      </Stack>
    </Grid>
  );
}
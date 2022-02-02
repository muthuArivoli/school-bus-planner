import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import Geocode from "react-geocode";
import { DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

let routeidcounter = 0;

const containerStyle = {
    height: "400px",
    width: "500px"
};

const studentColumns = [
  { field: 'studentid', hide: true, width: 30},
  { field: 'studentname', headerName: "Name", width: 150},
  { field: 'address', headerName: "Address", width: 400},
];

const routeColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", width: 150},
  { field: 'description', headerName: "Description", width: 100},
  { field: 'students', headerName: "Students", hide: true, width: 100},
];

// TODO: This will be from the backend
const addresses = [
  "4610 Club Terrace NE, Atlanta, GA",
  "10320 Bergtold Road, Clarence, NY",
  "Duke University",
  "White House",
  "104 E Hammond Street, Durham, NC",
];

const locations = [];

for (var i=0; i<addresses.length; i++) {
  const g = Geocode.fromAddress(addresses[i]).then(
    response => {
      return response.results[0].geometry.location;
    },
    error => {
      console.error(error);
    }
    );

    g.then((a) => {
      const {lat, lng} = a;
      locations.push({lat, lng});
    });
}

async function CoordsToAddress(latitude, longitude) {
  let g = await Geocode.fromLatLng(latitude, longitude).then(
    (response) => {
      return response.results[0].formatted_address;
    },
    (error) => {
      console.error(error);
    }
  );

  let data = JSON.stringify(g)
  return data;
}

const addLocationToRoute = async (location) => {
  let address_noformat = await CoordsToAddress(location.lat, location.lng);
  let address = address_noformat.replace(/['"]+/g, '');

  // TODO: Non-address fields will be from the backend (barring coords)
  return { studentid: 14, studentname: "temp", address: address, coords: location };
};

function getCenter(locations) {
  let lattotal = 0;
  let lngtotal = 0;

  for (var j = 0; j < locations.length; j++) {
    lattotal += locations[j].lat;
    lngtotal += locations[j].lng;
  }

  let avglat = lattotal / (locations.length);
  let avglng = lngtotal / (locations.length);

  const center = {
    lat: avglat,
    lng: avglng
  };
  return center;
}

export default function RoutePlanner() {
 const [studentRows, setStudentRows] = React.useState([]); //rows of data grid: "Students in Current Row"
 const [routeRows, setRouteRows] = React.useState([]); //rows of data grid: "Current Rows"
 const [routeInfo, setRouteInfo] = React.useState({"name": "", "description": ""}); //values from text fields
 const [displayed, setDisplayed] = React.useState([]); //behind-the-scenes state to track studentRow display

  React.useEffect(() => {
  let newDisplayed = [];
  for (var i=0;i<addresses.length;i++) {
      newDisplayed = [...newDisplayed, {"address": addresses[i], "isBeingDisplayed": false}];
  }
  setDisplayed(newDisplayed);
  }, []);

  const center = getCenter(locations);

  const handleClick = (location, index) => {
    if (!displayed[index]["isBeingDisplayed"]) {
      addLocationToRoute(location).then((res) => {
          let newDisplayed = JSON.parse(JSON.stringify(displayed));
          newDisplayed[index]["isBeingDisplayed"] = true;
          setDisplayed(newDisplayed);
          let newRows = [...studentRows, res];
          setStudentRows(newRows);
      })
    } else if (displayed[index]["isBeingDisplayed"]) {
      let newDisplayed = JSON.parse(JSON.stringify(displayed));
      newDisplayed[index]["isBeingDisplayed"] = false;
      setDisplayed(newDisplayed);
      setStudentRows(studentRows.filter((value) => value.coords !== location));
    }
  };

  //runs when user clicks on a route in the data grid, should fill text fields with data
  const handleEdit = (route) => {
    let new_routeInfo = JSON.parse(JSON.stringify(routeInfo));
    let new_studentRows = JSON.parse(JSON.stringify(studentRows));
    //set values
    new_routeInfo["name"] = route.name;
    new_routeInfo["description"] = route.description;
    new_studentRows = route.students;
    setRouteInfo(new_routeInfo);
    setStudentRows(new_studentRows);
    deleteRouteRow(route.id);
    //set displayed values to true for students
    let newDisplayed = JSON.parse(JSON.stringify(displayed));
    for (var i=0;i<displayed.length;i++) {
      newDisplayed[i]["isBeingDisplayed"] = true;
    }
    setDisplayed(newDisplayed);
  };

   const deleteRouteRow = React.useCallback((id) => {
     setTimeout(() => {
      setRouteRows((routeRows) => routeRows.filter((row) => row.id !== id));
    });
   }, []);

  //runs when user clicks on "Add Route" button, should add info to "Current Route" data grid
  const handleAddRoute = () => {
    routeidcounter += 1;
    let newRoute = {"id": routeidcounter, "name": routeInfo["name"], "description": routeInfo["description"], "students": studentRows};
    let newRouteRows = [...routeRows, newRoute];
    setRouteRows(newRouteRows);
    // Clear fields
    setRouteInfo({"name": "", "description": ""});
    setStudentRows([]);

    let newDisplayed = JSON.parse(JSON.stringify(displayed));
    for (var i=0;i<displayed.length;i++) {
      newDisplayed[i]["isBeingDisplayed"] = false;
    }
    setDisplayed(newDisplayed);
  };

  //runs when user types in textfield, should add value into correct part of routeInfo
  const handleInfoChange = (fieldindicator, new_value) => {
    let newInfo = JSON.parse(JSON.stringify(routeInfo));
    if (fieldindicator == "name") {
      newInfo["name"] = new_value;
      setRouteInfo(newInfo);
    }
    else if (fieldindicator == "description") {
      newInfo["description"] = new_value;
      setRouteInfo(newInfo);
    }
  };

  return (
    <Stack spacing={5} justifyContent="center">
    <Stack direction="row" spacing={8} justifyContent="center">
      <Stack spacing={2.5} justifyContent="center">
        <LoadScript
          googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
        >
          <GoogleMap mapContainerStyle={containerStyle} zoom={3} center={center}>
            {locations.map((location, index) => (
                <Marker key={index} title={addresses[index]} position={location} onClick={() => handleClick(location, index)}/> ))}
          </GoogleMap>
        </LoadScript>

        <Stack spacing={0} justifyContent="center">
          <Typography variant="h5" align="left">
            Current Routes:
          </Typography>
          <div style={{ height: 400, width: 400 }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flexGrow: 1 }}>
                <DataGrid
                  rows={routeRows}
                  columns={routeColumns}
                  //getRowId={(row) => row.id} //THIS WILL BE THE ID FROM THE BACKEND ONCE IMPLEMENTED
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  density="compact"
                  onRowClick={(route) => handleEdit(route.row)}
                />
              </div>
            </div>
          </div>
        </Stack>
      </Stack>
      <Stack spacing={2.5} justifyContent="center">
        <TextField
          fullWidth
          variant="outlined"
          label="Route Name"
          value={routeInfo["name"]}
          onChange={(e) => handleInfoChange("name", e.target.value)}
        />
        <TextField
          fullWidth
          variant="outlined"
          label="Route Description"
          multiline
          rows={10}
          value={routeInfo["description"]}
          onChange={(e) => handleInfoChange("description", e.target.value)}
        />
        <Stack spacing={0} justifyContent="center">
          <Typography variant="h5" align="left">
            Current Students in Route:
          </Typography>
          <div style={{ height: 400, width: 400 }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flexGrow: 1 }}>
                <DataGrid
                  rows={studentRows}
                  columns={studentColumns}
                  getRowId={(row) => row.address} //THIS WILL BE THE ID FROM THE BACKEND ONCE IMPLEMENTED
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  density="compact"
                />
              </div>
            </div>
          </div>
        </Stack>
        <Button variant="contained" color="primary" onClick={handleAddRoute}>
          Add Route
        </Button>
      </Stack>  
    </Stack>
    <Button variant="contained" color="primary" /*onClick={handleAddRoute}*/>
      Submit/Finish
    </Button>
    </Stack>
  )
} 
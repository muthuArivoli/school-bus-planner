import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import Geocode from "react-geocode";
import { DataGrid } from '@mui/x-data-grid';

Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

const containerStyle = {
  width: '50%',
  height: '50vh'
};

const columns = [
  { field: 'studentid', width: 0},
  { field: 'studentname', headerName: "Name", width: 150},
  { field: 'address', headerName: "Address", width: 400},
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

export default function Map() {
 const [rows, setRows] = React.useState([]);
 const [displayed, setDisplayed] = React.useState([]);

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
          let newRows = [...rows, res];
          setRows(newRows);
      })
    } else if (displayed[index]["isBeingDisplayed"]) {
      let newDisplayed = JSON.parse(JSON.stringify(displayed));
      newDisplayed[index]["isBeingDisplayed"] = false;
      setDisplayed(newDisplayed);
      setRows(rows.filter((value, ind) => value.coords !== location));
    }
  };

  return (
    <Stack direction="row" spacing={5} justifyContent="center">
      <LoadScript
        googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
      >
        <GoogleMap id='marker-example' mapContainerStyle={containerStyle} zoom={3} center={center}>
            {locations.map((location, index) => (
                <Marker key={index} position={location} onClick={() => handleClick(location, index)}/>
              ))
            }
        </GoogleMap>
      </LoadScript>

      <div style={{ height: 400, width: 600 }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.address} //THIS WILL BE THE ID FROM THE BACKEND ONCE IMPLEMENTED
              pageSize={5}
              rowsPerPageOptions={[5]}
              density="compact"
              initialState={{
                columns: {
                  columnVisibilityModel: {
                   studentid: false,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </Stack>
  )
}
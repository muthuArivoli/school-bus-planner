import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import Geocode from "react-geocode";
import { DataGridPro, useGridApiRef } from '@mui/x-data-grid-pro';

Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

const containerStyle = {
  width: '50%',
  height: '50vh'
};

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

async function helper(latitude, longitude) {
  let g = await Geocode.fromLatLng(latitude, longitude).then(
    (response) => {
      const address = response.results[0].formatted_address;
      let city, state, country;
      for (let i = 0; i < response.results[0].address_components.length; i++) {
        for (let j = 0; j < response.results[0].address_components[i].types.length; j++) {
          switch (response.results[0].address_components[i].types[j]) {
            case "locality":
              city = response.results[0].address_components[i].long_name;
              break;
            case "administrative_area_level_1":
              state = response.results[0].address_components[i].long_name;
              break;
            case "country":
              country = response.results[0].address_components[i].long_name;
              break;
          }
        }
      }
      //console.log(city, state, country);
      return address;
    },
    (error) => {
      console.error(error);
    }
  );

  let data = JSON.stringify(g)
  return data;
}

const createRandomRow = (m) => {
  let latitude = m.lat;
  let longitude = m.lng;

  let abc = await helper(latitude, longitude);

  return { id: 14, studentname: "temp", address: abc };
};

const columns = [
  { field: 'id', width: 50},
  { field: 'studentname', width: 150},
  { field: 'address', width: 250},
];

const rows = [];

export default function Map() {

  const apiRef = useGridApiRef();

  let lattotal = 0;
  let lngtotal = 0;

  for (var j=0; j<locations.length;j++) {
    lattotal += locations[j].lat
    lngtotal += locations[j].lng
  }

  let avglat = lattotal / (locations.length);
  let avglng = lngtotal / (locations.length);

  const center = { 
    lat: avglat, 
    lng: avglng
  };

  const handleAddRow = value => () => {
    //alert(createRandomRow(value));
    apiRef.current.updateRows([createRandomRow(value)]);
  };

  return (
    <Stack direction="row" spacing={5} justifyContent="center">
      <LoadScript
        googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
      >
        <GoogleMap id='marker-example' mapContainerStyle={containerStyle} zoom={3} center={center}>
            {locations.map((location) => (
                <Marker position={location} onClick={handleAddRow(location)}/>
              ))
            }
        </GoogleMap>
      </LoadScript>

      <div style={{ height: 400, width: 450 }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <DataGridPro
              apiRef={apiRef}
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id} //set what is used as ID ******MUST BE UNIQUE***********
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              density="compact"
            />
          </div>
        </div>
      </div>

    </Stack>
  )
}
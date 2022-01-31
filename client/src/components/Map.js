import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import Geocode from "react-geocode";
import { DataGridPro, useGridApiRef } from '@mui/x-data-grid-pro';
import Button from '@mui/material/Button';

Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

const containerStyle = {
  width: '50%',
  height: '50vh'
};

const columns = [
  { field: 'id', width: 50},
  { field: 'studentname', width: 150},
  { field: 'address', width: 400},
];

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

  return { id: 14, studentname: "temp", address: address };
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
 const [selectedRows, setSelectedRows] = React.useState([]);

  const apiRef = useGridApiRef();

  const center = getCenter(locations);

  const handleAddRow = (value) => {
    addLocationToRoute(value).then((res) => {
        let newRows = [...rows, res];
        setRows(newRows);
    })
  };

  const handleDeleteRow = () => {
    let unselected_rows = [];
    const rowIds = apiRef.current.getAllRowIds();
    
    for (var i=0; i<rowIds.length;i++) {
      if (!selectedRows.includes(rowIds[i])) {
        unselected_rows.push(apiRef.current.getRow(rowIds[i]));
      }
      setRows(unselected_rows);
    }
  };

  return (
    <Stack direction="row" spacing={5} justifyContent="center">
      <LoadScript
        googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
      >
        <GoogleMap id='marker-example' mapContainerStyle={containerStyle} zoom={3} center={center}>
            {locations.map((location) => (
                <Marker position={location} onClick={() => handleAddRow(location)}/>
              ))
            }
        </GoogleMap>
      </LoadScript>

      <Stack spacing={1} justifyContent="center">
        <div style={{ height: 400, width: 600 }}>
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flexGrow: 1 }}>
              <DataGridPro
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                getRowId={(row) => row.address} //set what is used as ID ******MUST BE UNIQUE***********
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
                onSelectionModelChange={(ids) => {
                  const selectedIDs = new Set(ids);
                  const selectedRows = rows.filter((row) =>
                    selectedIDs.has(row.id),
                  );
                  setSelectedRows(selectedRows);
                }}
                density="compact"
              />
            </div>
          </div>
        </div>
        <Button variant="contained" color="primary" onClick={handleDeleteRow}>Remove Selected Locations</Button>
      </Stack>
    </Stack>
  )
}
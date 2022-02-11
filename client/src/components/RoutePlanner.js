import React from 'react'
import { GoogleMap, LoadScript, Marker, useGoogleMap } from '@react-google-maps/api';
import Stack from '@mui/material/Stack';
import Geocode from "react-geocode";
import { DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

let api_key = "AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o";


Geocode.setApiKey(api_key);
Geocode.setLocationType("ROOFTOP");

const containerStyle = {
    height: "400px",
    width: "500px"
};

const mapOptions = {
  disableDoubleClickZoom: true
};

const studentColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", width: 150},
  { field: 'address', headerName: "Address", width: 400},
];

const routeColumns = [
  { field: 'id', hide: true, width: 30},
  { field: 'name', headerName: "Name", width: 150},
  { field: 'description', headerName: "Description", width: 100},
];

export default function RoutePlanner(props) {
  const [studentRows, setStudentRows] = React.useState([]); //rows of data grid: "Students in Current Row"
  const [routeRows, setRouteRows] = React.useState([]); //rows of data grid: "Current Routes"
  const [routeInfo, setRouteInfo] = React.useState({"name": "", "description": ""}); //values from text fields

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

  const [selectionModel, setSelectionModel] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [resetRoute, setResetRoute] = React.useState(false);

  const [schoolLocation, setSchoolLocation] = React.useState({lat: 0, lng:0});

  const [toggleSelection, setToggleSelection] = React.useState('students');

  const [stops, setStops] = React.useState([]);

    let { id } = useParams();
    let navigate = useNavigate();

    // load current routes into page
    React.useEffect(()=>{
    const fetchData = async() => {
        const result = await axios.get(
            process.env.REACT_APP_BASE_URL+`/school/${id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        if(result.data.success) {
            console.log(result.data.school);
            let newRouteRows = result.data.school.routes.map((value)=>{return {name: value.name, id: value.id, description: value.description}});
            setRouteRows(newRouteRows);
        }
        else{
            console.log("a");
            props.setSnackbarMsg(`Route could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/routes");
        }
    };
    fetchData();
    }, [resetRoute]);

    // load all student data for the school into page
    React.useEffect(()=>{
        const fetchData = async() => {
            const result = await axios.get(
              process.env.REACT_APP_BASE_URL+`/school/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if (result.data.success){
              console.log(result.data)
                let newRows = [];
                for(let i=0; i<result.data.school.students.length; i++){
                  const studentRes = await axios.get(
                    process.env.REACT_APP_BASE_URL+`/student/${result.data.school.students[i]}`, {
                      headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                      }
                    }
                  );
                  if(studentRes.data.success){
                        const userRes = await axios.get(
                            process.env.REACT_APP_BASE_URL+`/user/${studentRes.data.student.user_id}`, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                            }
                        );
                        if(userRes.data.success){
                            console.log(userRes.data.user);
                            const g = await Geocode.fromAddress(userRes.data.user.uaddress);
                            const {lat, lng} = g.results[0].geometry.location;
                            console.log(studentRes.data);
                            newRows = [...newRows, {name: studentRes.data.student.name, id: result.data.school.students[i], address: userRes.data.user.uaddress, location: {lat: lat, lng: lng}, route: studentRes.data.student.route_id}]
                        }
                        else{
                            props.setSnackbarMsg(`Route could not be loaded`);
                            props.setShowSnackbar(true);
                            props.setSnackbarSeverity("error");
                            navigate("/routes");
                        }
                  }
                  else{
                    props.setSnackbarMsg(`School could not be loaded`);
                    props.setShowSnackbar(true);
                    props.setSnackbarSeverity("error");
                    navigate("/schools");
                  }
                }
                setStudents(newRows);
            }
            else{
              console.log("d");
              props.setSnackbarMsg(`Route could not be loaded`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/routes");
            }
          };
          fetchData();
    }, [resetRoute])

    // load school data into page
    React.useEffect(()=>{
      const fetchData = async() => {
        const result = await axios.get(
          process.env.REACT_APP_BASE_URL+`/school/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if(result.data.success){
          const g = await Geocode.fromAddress(result.data.school.address);
          const {lat, lng} = g.results[0].geometry.location;
          console.log({lat: lat, lng: lng})
          setSchoolLocation({lat: lat, lng: lng})
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
        }
      }
      fetchData();  
    },[])

    // load route info into page if came in through route modify (I think?, doesn't work if so)
    React.useEffect(() => {
      const fetchStudents = async() => {
          if(selectionModel.length == 0){
              setRouteInfo({"name": "", "description": ""});
              setStudentRows([]);
              return;
          }
          console.log(selectionModel[0]);
          let response = await axios.get(
              process.env.REACT_APP_BASE_URL+`/route/${selectionModel[0]}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if(response.data.success){
              setRouteInfo({"name": response.data.route.name, "description": response.data.route.description});
              let newRows = [];
              for(let i=0; i<response.data.route.students.length; i++){
                  const studentRes = await axios.get(
                      process.env.REACT_APP_BASE_URL+`/student/${response.data.route.students[i]}`, {
                      headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                      }
                      }
                  );
                  if(studentRes.data.success){
                      console.log(studentRes.data);
                      const userRes = await axios.get(
                          process.env.REACT_APP_BASE_URL+`/user/${studentRes.data.student.user_id}`, {
                          headers: {
                              Authorization: `Bearer ${localStorage.getItem('token')}`
                          }
                          }
                      );
                      if(userRes.data.success){
                          console.log(userRes.data);
                          newRows = [...newRows, {name: studentRes.data.student.name, id: response.data.route.students[i], address: userRes.data.user.uaddress}]
                      }
                      else{
                        console.log("c")
                          props.setSnackbarMsg(`Route could not be loaded`);
                          props.setShowSnackbar(true);
                          props.setSnackbarSeverity("error");
                          navigate("/routes");
                      }
                  }
                  else{
                    console.log("b");
                      props.setSnackbarMsg(`Route could not be loaded`);
                      props.setShowSnackbar(true);
                      props.setSnackbarSeverity("error");
                      navigate("/routes");
                  }
            }
            console.log(newRows);
            setStudentRows(newRows);
          }
          

      }

      fetchStudents();
    }, [selectionModel])

  // function when snackbar is closed
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // function when marker is clicked
  const handleMarkerClick = (student, index) => {
    if (toggleSelection=="students") {
      let addresses = studentRows.map((value)=>{return value.address});
      if(addresses.includes(student.address)){
          let newStudentRows = studentRows.filter(value=> value.address != student.address)
          setStudentRows(newStudentRows)
      }
      else{
          let allStudents = students.filter(value => value.address == student.address)
          let newStudentRows = [...studentRows, ...allStudents];
          setStudentRows(newStudentRows);
      }
    }
  };

  // function when map is clicked (add stop)
  const handleMapClick = (value) => {
    if (toggleSelection=="stops") {

      let loc = {
        lat: value.lat(),
        lng: value.lng(),
      };

      let newStop = {loc: loc};

      let newStops = [...stops, newStop];
      setStops(newStops);
    }
  };

  // function when add/update route button is clicked
  const handleSubmit = (event) => {
    if(selectionModel.length == 0){
        console.log({
            school_id: id,
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
        })
        axios.post(process.env.REACT_APP_BASE_URL+`/route`, {
            school_id: parseInt(id),
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res)=>{
            if(res.data.success){
                setRouteInfo({"name": "", "description": ""});
                setStudentRows([]);
                setSnackbarOpen(true);
                setSnackbarSeverity('success');
                setSnackbarMsg('Route successfully created');
            }
            else{
                setSnackbarOpen(true);
                setSnackbarSeverity('error');
                setSnackbarMsg('Failed to create route');
            }
        }
        );
    }
    else{
        axios.patch(process.env.REACT_APP_BASE_URL+`/route/${selectionModel[0]}`, {
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res)=>{
            if(res.data.success){
                setRouteInfo({"name": "", "description": ""});
                setStudentRows([]);
                setSnackbarOpen(true);
                setSnackbarSeverity('success');
                setSnackbarMsg('Route successfully updated');
            }
            else{
                setSnackbarOpen(true);
                setSnackbarSeverity('error');
                setSnackbarMsg('Failed to update route');
            }
        }
        );

    }
    setSelectionModel([]);
    setResetRoute(!resetRoute);
  }

  // function when things are typed into text fields (name, description)
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

  const handleToggleMode = (event, newToggle) => {
    if (newToggle.length) {
      setToggleSelection(newToggle);
    }
    console.log("mode: "+newToggle);
  };

  return (
    <>
    <ToggleButtonGroup
        color="primary"
        value={toggleSelection}
        exclusive
        onChange={handleToggleMode}
      >
        <ToggleButton value="students">Student Mode</ToggleButton>
        <ToggleButton value="stops">Stops Mode</ToggleButton>
    </ToggleButtonGroup>

    <Snackbar open={snackbarOpen} onClose={handleClose}>
      <Alert onClose={handleClose} severity={snackbarSeverity}>
        {snackbarMsg}
      </Alert>
    </Snackbar>
      
    <Stack direction="row" spacing={8} justifyContent="center">
      <Stack spacing={2.5} justifyContent="center">
        <LoadScript googleMapsApiKey={api_key}>
          <GoogleMap mapContainerStyle={containerStyle} zoom={7} options={mapOptions} center={schoolLocation} onDblClick={(value) => handleMapClick(value.latLng)}>
            <Marker title="School" label="School" position={schoolLocation}/>
            {students.map((student, index) => (
              <Marker key={index} title={student.address} position={student.location} onClick={() => handleMarkerClick(student, index)} label={student.route == null ? "0" : "1"}/> ))
            }
            {toggleSelection=="stops" ? stops.map((stop, index) => (
              <Marker key={index} title={"Stop"} position={stop.loc} /**onClick={() => handleMarkerClick(student, index)}**/ label={"s"}/>)) : []
            }
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
                  selectionModel={selectionModel}
                  onSelectionModelChange={(selectionModel) => setSelectionModel(selectionModel)}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  density="compact"
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
                  getRowId={(row) => row.id}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  density="compact"
                />
              </div>
            </div>
          </div>
        </Stack>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={routeInfo["name"] == ""}>
          {selectionModel.length == 0 ? "Add Route" : "Update Route"}
        </Button>
      </Stack>  
    </Stack>
    </>
  )
} 
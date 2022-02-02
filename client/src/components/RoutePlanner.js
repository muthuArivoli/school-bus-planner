import React from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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


Geocode.setApiKey("AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o");
Geocode.setLocationType("ROOFTOP");

// @todo: https://github.com/JustFly1984/react-google-maps-api/issues/70
// see: https://github.com/JustFly1984/react-google-maps-api/issues/159#issuecomment-502446663
class LoadScriptOnlyIfNeeded extends LoadScript {
    componentDidMount() {
      const cleaningUp = true;
      const isBrowser = typeof document !== 'undefined'; // require('@react-google-maps/api/src/utils/isbrowser')
      const isAlreadyLoaded =
        window.google &&
        window.google.maps &&
        document.querySelector('body.first-hit-completed'); // AJAX page loading system is adding this class the first time the app is loaded
      if (!isAlreadyLoaded && isBrowser) {
        // @ts-ignore
        if (window.google && !cleaningUp) {
          console.error('google api is already presented');
          return;
        }
  
        this.isCleaningUp().then(this.injectScript);
      }
  
      if (isAlreadyLoaded) {
        this.setState({ loaded: true });
      }
    }
  }

const containerStyle = {
    height: "400px",
    width: "500px"
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

function getCenter(students) {
  let lattotal = 0;
  let lngtotal = 0;

  if(students.length == 0){
      return {lat: 0, lng: 0}
  }

  for (var j = 0; j < students.length; j++) {
    lattotal += students[j].location.lat;
    lngtotal += students[j].location.lng;
  }

  let avglat = lattotal / (students.length);
  let avglng = lngtotal / (students.length);

  const center = {
    lat: avglat,
    lng: avglng
  };
  return center;
}

export default function RoutePlanner(props) {
  const [studentRows, setStudentRows] = React.useState([]); //rows of data grid: "Students in Current Row"
  const [routeRows, setRouteRows] = React.useState([]); //rows of data grid: "Current Rows"
 const [routeInfo, setRouteInfo] = React.useState({"name": "", "description": ""}); //values from text fields

 const [snackbarOpen, setSnackbarOpen] = React.useState(false);
 const [snackbarMsg, setSnackbarMsg] = React.useState("");
 const [snackbarSeverity, setSnackbarSeverity] = React.useState("error");

    const [selectionModel, setSelectionModel] = React.useState([]);
    const [students, setStudents] = React.useState([]);
    const [center, setCenter] =React.useState({lat: 0, lng:0});
    const [resetRoute, setResetRoute] = React.useState(false);

    let { id } = useParams();
    let navigate = useNavigate();

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
    
        setSnackbarOpen(false);
      };

    React.useEffect(()=>{
    // set route rows
    const fetchData = async() => {
        const result = await axios.get(
            `http://localhost:5000/school/${id}`, {
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

    React.useEffect(()=>{
        const fetchData = async() => {
            const result = await axios.get(
              `http://localhost:5000/school/${id}`, {
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
                    `http://localhost:5000/student/${result.data.school.students[i]}`, {
                      headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                      }
                    }
                  );
                  if(studentRes.data.success){
                        const userRes = await axios.get(
                            `http://localhost:5000/user/${studentRes.data.student.user_id}`, {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                            }
                        );
                        if(userRes.data.success){
                            console.log(userRes.data.user);
                            const g = await Geocode.fromAddress(userRes.data.user.uaddress);
                            const {lat, lng} = g.results[0].geometry.location;
                            newRows = [...newRows, {name: studentRes.data.student.name, id: result.data.school.students[i], address: userRes.data.user.uaddress, location: {lat: lat, lng: lng}}]
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
    },[])

    React.useEffect(()=>{
        setCenter(getCenter(students));
    }, [students])

  const handleClick = (student, index) => {
    let ids = studentRows.map((value)=>{return value.id});
    if(ids.includes(student.id)){
        let newStudentRows = studentRows.filter(value=> value.id != student.id)
        setStudentRows(newStudentRows)
    }
    else{
        let newStudentRows = [...studentRows, {id: student.id, address: student.address, name: student.name}];
        setStudentRows(newStudentRows);
    }
  };

  React.useEffect(() => {
    const fetchStudents = async() => {
        if(selectionModel.length == 0){
            setRouteInfo({"name": "", "description": ""});
            setStudentRows([]);
            return;
        }
        console.log(selectionModel[0]);
        let response = await axios.get(
            `http://localhost:5000/route/${selectionModel[0]}`, {
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
                    `http://localhost:5000/student/${response.data.route.students[i]}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                    }
                );
                if(studentRes.data.success){
                    console.log(studentRes.data);
                    const userRes = await axios.get(
                        `http://localhost:5000/user/${studentRes.data.student.user_id}`, {
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

  const handleSubmit = (event) => {
    if(selectionModel.length == 0){
        console.log({
            school_id: id,
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
        })
        axios.post(`http://localhost:5000/route`, {
            school_id: parseInt(id),
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
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
        axios.patch(`http://localhost:5000/route/${selectionModel[0]}`, {
            name: routeInfo["name"],
            description: routeInfo["description"],
            students: studentRows.map((value)=>{return value.id})
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
    <>
    <Snackbar open={snackbarOpen} onClose={handleClose}>
    <Alert onClose={handleClose} severity={snackbarSeverity}>
      {snackbarMsg}
    </Alert>
  </Snackbar>
    <Stack spacing={5} justifyContent="center">
    <Stack direction="row" spacing={8} justifyContent="center">
      <Stack spacing={2.5} justifyContent="center">
        <LoadScript
          googleMapsApiKey="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o"
        >
          <GoogleMap mapContainerStyle={containerStyle} zoom={3} center={center}>
            {students.map((student, index) => (
                <Marker key={index} title={student.address} position={student.location} onClick={() => handleClick(student, index)}/> ))}
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
                  getRowId={(row) => row.id} //THIS WILL BE THE ID FROM THE BACKEND ONCE IMPLEMENTED
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
    </Stack>
    </>
  )
} 
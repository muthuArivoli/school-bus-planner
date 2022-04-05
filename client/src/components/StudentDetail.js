import * as React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {Link as RouterLink, useParams, useNavigate} from 'react-router-dom';
import DeleteDialog from './DeleteDialog';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { Helmet } from 'react-helmet';

export default function StudentDetail(props) {

  let { id } = useParams();
  let navigate = useNavigate();
  const [error, setError] = React.useState(false);

  const [data, setData] = React.useState({});
  const [user, setUser] = React.useState({});
  const [school, setSchool] = React.useState("");

  const [route, setRoute] = React.useState("No Route");
  const [inRange, setInRange] = React.useState("No");
  const [bus, setBus] = React.useState("");
  const [inTransit, setInTransit] = React.useState("");
  const [busDriver, setBusDriver] = React.useState("");

  const [role, setRole] = React.useState(0);

  const [email, setEmail] = React.useState("");
  React.useEffect(()=>{
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if(result.data.success){
        setRole(result.data.user.role);
      }
      else{
        props.setSnackbarMsg(`Current user could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/");
      }
    }
    fetchData();
  }, []) 
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  const handleDelete = () => {
    axios.delete(process.env.REACT_APP_BASE_URL+`/student/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if(res.data.success) {
        props.setSnackbarMsg(`Student successfully deleted`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/students");
      }
      else {
        setError(true);
      }
    }).catch((err) => {
      console.log(err.response)
      console.log(err.response.status)
      console.log(err.response.headers)
    });
  }

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/student/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.student);
        setSchool(result.data.student.school.name);
        setUser(result.data.student.user);

        console.log("result.data.student");
        console.log(result.data.student); 
        if(result.data.student.route_id != null){
          setRoute(result.data.student.route.name);
          setBus(result.data.student.route.bus);

        }
        else {
          setRoute("No Route");
        }

        if (result.data.student.in_range == true){
          setInRange("Yes");
        }
        else{
          setInRange("No");
        }

        if(result.data.student.email != null){
          setEmail(result.data.student.email);

        }

      }
      else{
        props.setSnackbarMsg(`Student could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/students");
      }

    };

    fetchData();
  }, []);
  
  return (
    <>
    <Helmet>
      <title>
        {data.name + " - Detail"}
      </title>
    </Helmet>
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity="error">
      Failed to delete student.
    </Alert>
  </Snackbar>
    <Grid container justifyContent="center" pt={5}>
    <Stack spacing={2} justifyContent="center">
        <Typography variant="h4" align="center">
                Student Info
        </Typography>
    </Stack>

      <Stack spacing={5} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={15} justifyContent="center">
          <Typography variant="h5" align="center">
            Name: {data.name}
          </Typography>
          <Typography variant="h5" align="center">
            Student ID: {data.student_id}
          </Typography>

          { email != null &&
          <Typography variant = "h5" align = "center">
            Student Email: {email}
          </Typography>
          }   
        </Stack>

        <Stack direction="row" spacing={20} justifyContent="center">
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              {"School: "} 
              <Link component={RouterLink} to={"/schools/" + data.school_id}>
                {school}
              </Link>
            </Typography>
          </Stack>
        </Stack>
        
        <Stack direction="row" spacing={15} justifyContent="center">
        {
            route == "No Route" &&
            <Typography variant="h5" align="center">
              Route: {route}
            </Typography>
            }
            {
            route != "No Route" &&
            <>
            <Typography variant="h5" align="center">
            {"Route: "} 
            <Link component={RouterLink} to={"/routes/" + data.route_id}>
              {route}
            </Link>
            </Typography>
            <Typography variant="h5" align="center">
              In Route Range: {inRange}
            </Typography> 
            </>
            }
          {
          route != "No Route" &&
          <Typography variant="h5" align="center">
            Route In Transit: {/* */}
          </Typography>
          }  
        </Stack>

                
        <Stack direction="row" spacing={15} justifyContent="center">

          {
          route != "No Route" &&
          <Typography variant="h5" align="center">
            Bus: {bus}
          </Typography>
          }
          { route != "No Route" &&
          <Typography variant = "h5" align = "center">
            Bus Driver: {/* */}
          </Typography>
          }   
        </Stack>

        <Divider id="divider" variant="fullWidth" style={{width:'100%'}}/>

        <Stack spacing={2} justifyContent="center">
        <Typography variant="h4" align="center">
                Parent Info
              </Typography>
        </Stack>

          <Stack spacing={2} justifyContent="center">
            <Stack direction="row" spacing={20} justifyContent="center">
              <Typography variant="h5" align="center">
                {"Name: "} 
                <Link component={RouterLink} to={"/users/" + user.id}>
                  {user.full_name}
                </Link>
              </Typography>
              <Typography variant="h5" align="center">
                Email: {user.email}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={20} justifyContent="center">
              <Typography variant="h5" align="center">
                Address: {user.uaddress}
              </Typography>
              <Typography variant="h5" align="center">
                Phone: {user.phone}
              </Typography>
            </Stack>
          </Stack>
        

        <Stack direction="row" spacing={3} justifyContent="center">
          {
          (role == 1 || role == 2) &&
          <Button component={RouterLink}
              to={"/students/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ }}>
              Modify
          </Button>
          }
          {
          (role == 1 || role == 2) &&
          <DeleteDialog dialogTitle="Delete Student?" dialogDesc={`Please confirm you would like to delete student ${data.name}`} onAccept={handleDelete}/>
          }
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
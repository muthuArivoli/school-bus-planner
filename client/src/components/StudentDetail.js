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

export default function StudentDetail(props) {

  let { id } = useParams();
  let navigate = useNavigate();
  const [error, setError] = React.useState(false);

  const [data, setData] = React.useState({});

  const [school, setSchool] = React.useState("");

  const [route, setRoute] = React.useState("No Route");

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

        if(result.data.student.route_id != null){
          const routRes = await axios.get(
            process.env.REACT_APP_BASE_URL+`/route/${result.data.student.route_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (routRes.data.success){
            setRoute(routRes.data.route.name);
          }
          else{
            props.setSnackbarMsg(`Student could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }
        }
        else {
          setRoute("No Route");
        }

        const schoolRes = await axios.get(
          process.env.REACT_APP_BASE_URL+`/school/${result.data.student.school_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (schoolRes.data.success){
          setSchool(schoolRes.data.school.name);
        }
        else{
          props.setSnackbarMsg(`Student could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/students");
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
    <Snackbar open={error} onClose={handleClose}>
    <Alert onClose={handleClose} severity="error">
      Failed to delete student.
    </Alert>
  </Snackbar>
    <Grid container justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack direction="row" spacing={15} justifyContent="center">
          <Typography variant="h5" align="center">
            Name: {data.name}
          </Typography>
          <Typography variant="h5" align="center">
            Student ID: {data.student_id}
          </Typography>

        </Stack>

        <Stack direction="row" spacing={20} justifyContent="center">
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              School: {school}
            </Typography>
            <Button component={RouterLink}
              to={"/schools/" + data.school_id}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View School
            </Button>
          </Stack>
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              Route: {route}
            </Typography>
            <Button component={RouterLink}
              disabled={route == "No Route"}
              to={"/routes/" + data.route_id}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View Route
            </Button>
 
            <Typography variant="h5" align="center">
              In Route Range:  {/* {in_range} */}
             
            </Typography> 


          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/students/" + id +"/update"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Student?" dialogDesc={`Please confirm you would like to delete student ${data.name}`} onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
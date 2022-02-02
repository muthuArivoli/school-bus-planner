import React, { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import {Link as RouterLink, useParams} from 'react-router-dom';
import DeleteDialog from '../DeleteDialog';
import Typography from '@mui/material/Typography';
import RouteDetailStudentList from './RouteDetailStudentList';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MuiAlert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function RouteDetail(props) {

  let { id } = useParams();

  const [error, setError] = useState(false);
  const [data, setData] = useState({});

  const [school, setSchool] = useState("");
  const [rows, setRows] = useState([]);
  let navigate = useNavigate();

  const handleDelete = () => {
      axios.delete(`http://localhost:5000/route/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then((res) => {
        if(res.data.success) {
          props.setSnackbarMsg(`Route successfully deleted`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/routes");
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

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        `http://localhost:5000/route/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.route);

        const schoolRes = await axios.get(
          `http://localhost:5000/school/${result.data.route.school_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (schoolRes.data.success){
          setSchool(schoolRes.data.school.name);
        }
        else{
          props.setSnackbarMsg(`Route could not be loaded`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/routes");
        }

        console.log(result.data.route);
        let newRows = [];
        for(let i=0; i<result.data.route.students.length; i++){
          const studentRes = await axios.get(
            `http://localhost:5000/student/${result.data.route.students[i]}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if(studentRes.data.success){
            newRows = [...newRows, {name: studentRes.data.student.name, id: result.data.route.students[i]}]
          }
          else{
            props.setSnackbarMsg(`Route could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/routes");
          }
        }
        setRows(newRows);
      }
      else{
        props.setSnackbarMsg(`Route could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }

    };

    fetchData();
  }, []);

  return (
    <>
    <Snackbar open={error} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error">
        Failed to delete route.
      </Alert>
    </Snackbar>
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4} sx={{ width: '100%'}}>
        <Stack spacing={4} justifyContent="center">
          <Stack direction="row" spacing={4} justifyContent="center">
            <Typography variant="h5" align="center">
              Route Name: {data.name}
            </Typography>
            <Typography variant="h5" align="center">
              School: {school}
            </Typography>
          </Stack>
          <TextField
          label="Description"
          value={data.description}
          InputProps={{
            readOnly: true,
          }}
          multiline
          focused
          />

<Button component={RouterLink}
              to={"/schools/" + data.school_id}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View School
            </Button>
        </Stack>

        <RouteDetailStudentList rows={rows}/>

        <Stack direction="row" spacing={3} justifyContent="center">
          <Button component={RouterLink}
              to={"/schools/" + data.school_id +"/routes"}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              Modify
          </Button>
          <DeleteDialog dialogTitle="Delete Route?" dialogDesc="Please confirm you would like to delete this route" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
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

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setError(false);
  };

  const handleDelete = () => {
    axios.delete(` http://localhost:5000/student/${id}`, {
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


  
  const schoolid = null;
  const routeid = null;
  
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
            Name
          </Typography>
          <Typography variant="h5" align="center">
            Student ID
          </Typography>
        </Stack>

        <Stack direction="row" spacing={20} justifyContent="center">
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              School
            </Typography>
            <Button component={RouterLink}
              to={"/schools/" + schoolid}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View School
            </Button>
          </Stack>
          <Stack spacing={1} justifyContent="center">
            <Typography variant="h5" align="center">
              Route
            </Typography>
            <Button component={RouterLink}
              to={"/routes/" + routeid}
              color="primary"
              variant="outlined"
              size="small"
              style={{ marginLeft: 16 }}>
              View Route
            </Button>
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
          <DeleteDialog dialogTitle="Delete Student?" dialogDesc="Please confirm you would like to delete this student" onAccept={handleDelete}/>
        </Stack>
      </Stack>
    </Grid>
    </>
  );
}
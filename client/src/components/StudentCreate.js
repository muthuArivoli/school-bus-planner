import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import StudentForm from './StudentForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function CreateSchool(props) {

  let navigate = useNavigate();

    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      // eslint-disable-next-line no-console
      axios.post('http://localhost:5000/student', {

      }).then((res) => {
        if (res.data.success){
          props.setSnackbarMsg(`Student successfully created`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/students");
        }
        else{
          props.setSnackbarMsg(`Student not successfully created`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/students");
        }
      }).catch((error) => {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
      });
    }

    return(
        <>
          <Typography component="h1" variant="h5">
            Create Student
          </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>  
        <StudentForm/>
        <Button type="submit"
                  variant="contained"
                  onClick={handleSubmit}
                  >
                    Submit
        </Button>
        </Box>
        </>
    )
}
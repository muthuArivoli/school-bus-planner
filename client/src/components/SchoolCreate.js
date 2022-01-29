import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from './SchoolForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



export default function CreateSchool(props) {

    let navigate = useNavigate();

    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
  
      axios.post("http://localhost:5000/school", {
        name: data.get('name'),
        address: data.get('address')
      }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then((res) => {
        if (res.data.success){
          props.setSnackbarMsg(`School successfully created`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/schools");
        }
        else{
          props.setSnackbarMsg(`School not successfully created`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("error");
          navigate("/schools");
        }
      });
    };

    return(
        <>
          <Typography component="h1" variant="h5">
            Create School
          </Typography>
        <SchoolForm handleSubmit={handleSubmit}/>
        </>
    )
}
import * as React from 'react';
import Typography from '@mui/material/Typography';
import SchoolForm from './SchoolForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



export default function CreateSchool(props) {

    let navigate = useNavigate();

    const handleSubmit = (event, name, address, latitude, longitude) => {
      event.preventDefault();

      axios.post(process.env.REACT_APP_BASE_URL+"/school", {
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude
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
        <SchoolForm handleSubmit={handleSubmit} name="" address="" title="Create School" latitude={null} longitude={null}/>
        </>
    )
}
import * as React from 'react';
import SchoolForm from './SchoolForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

export default function CreateSchool(props) {

    let navigate = useNavigate();

    const handleSubmit = (event, name, address, latitude, longitude, arrivalTime, departureTime) => {
        event.preventDefault();
        var offset = arrivalTime.getTimezoneOffset() / 60; 
        arrivalTime.setHours(arrivalTime.getHours() - offset);
        departureTime.setHours(departureTime.getHours() - offset);
        var parsedArrivalTime = arrivalTime.toISOString();
        var parsedDepartureTime = departureTime.toISOString();
        axios.post(process.env.REACT_APP_BASE_URL+"/school", {
          name: name,
          address: address,
          latitude: latitude,
          longitude: longitude,
          arrival_time: parsedArrivalTime,
          departure_time: parsedDepartureTime
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
            props.setSnackbarMsg(res.data.msg);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        });
    };


    return(
      <>
        <Helmet>
          <title>
            Create School
          </title>
        </Helmet>
        <SchoolForm handleSubmit={handleSubmit} name="" address="" latitude={null} longitude={null} arrivalTime="" departureTime="" title="Create School" />
      </>
    )
}
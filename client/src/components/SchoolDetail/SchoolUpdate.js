import * as React from 'react';
import SchoolForm from '../SchoolForm';
import axios from 'axios';
import { useParams, useNavigate} from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function UpdateSchool(props) {
    let navigate = useNavigate();
    let { id } = useParams();

    const [name, setName] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [latitude, setLatitude] = React.useState(null);
    const [longitude, setLongitude] = React.useState(null);

    const [departureTime, setDepartureTime] = React.useState(new Date('2018-01-01T00:00:00.000Z'));
    const [arrivalTime, setArrivalTime] = React.useState(new Date('2018-01-01T00:00:00.000Z'));


    const handleSubmit = (event, na, ad, lat, long, arrivalTimeLoc, departureTimeLoc) => {
        event.preventDefault();
        var offset = arrivalTimeLoc.getTimezoneOffset() / 60; 
        arrivalTimeLoc.setHours(arrivalTimeLoc.getHours() - offset);
        departureTimeLoc.setHours(departureTimeLoc.getHours() - offset);
        var arrive = arrivalTimeLoc.toISOString();
        var depart = departureTimeLoc.toISOString();
        console.log({
          name: na,
          address: ad,
          latitude: lat,
          longitude: long,
          departure_time: depart,
          arrival_time: arrive
        });

        axios.patch(process.env.REACT_APP_BASE_URL+`/school/${id}`, {
          name: na,
          address: ad,
          latitude: lat,
          longitude: long,
          departure_time: depart,
          arrival_time: arrive
        }, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }).then((res) => {
          if (res.data.success){
            props.setSnackbarMsg(`School successfully updated`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("success");
            navigate("/schools");
          }
          else{
            props.setSnackbarMsg(`School not successfully updated`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        });
      };

      React.useEffect(() => {
        const fetchData = async() => {
          const result = await axios.get(
            process.env.REACT_APP_BASE_URL+`/school/${id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (result.data.success){
            setName(result.data.school.name);
            setAddress(result.data.school.address);
            setLongitude(result.data.school.longitude);
            setLatitude(result.data.school.latitude);
            setDepartureTime(new Date('2011-10-10T' + result.data.school.departure_time));
            setArrivalTime(new Date('2011-10-10T' + result.data.school.arrival_time));
            console.log(result.data.school);
          }
          else{
            props.setSnackbarMsg(`School could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/schools");
          }
        };
        fetchData();
      }, []);

    return(
        <>
        <Helmet>
        <title>
          Update School
        </title>
        </Helmet>
        <SchoolForm 
        name={name} 
        address={address} 
        departureTime={departureTime} 
        arrivalTime={arrivalTime}
        latitude={latitude} 
        longitude={longitude} 
        handleSubmit={handleSubmit} 
        title="Update School"/>
        </>
    )
}
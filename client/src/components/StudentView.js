import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import {Link as RouterLink, useParams} from 'react-router-dom';
import axios from 'axios';
import Typography from '@mui/material/Typography';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function StudentDetail() {

  let { id } = useParams();
  const [data, setData] = React.useState({});
  const [school, setSchool] = React.useState({});
  const [route, setRoute] = React.useState({name: "No Route", description: ""});

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        `http://localhost:5000/student/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setData(result.data.student);

        if(result.data.student.route_id != null){
          const routRes = await axios.get(
            `http://localhost:5000/route/${result.data.student.route_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (routRes.data.success){
            setRoute(routRes.data.route);
          }
        }
        else {
          setRoute({name: "No Route", description: ""});
        }

        const schoolRes = await axios.get(
          `http://localhost:5000/school/${result.data.student.school_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (schoolRes.data.success){
          setSchool(schoolRes.data.school);
        }

      }

    };

    fetchData();
  }, []);

  return (
    <Grid container alignItems="center" justifyContent="center" pt={5}>
      <Stack spacing={4}>
        <Typography variant="h5" align="center">Name: {data.name}</Typography>
        <Typography variant="h5" align="center">ID: {data.student_id}</Typography>
          <Typography variant="h5" align="center">School Name: {school.name}</Typography>
          <Typography variant="h5" align="center">School Address: {school.address}</Typography>
          <Typography variant="h5" align="center">Route Name: {route.name}</Typography>

          {
            route.name != "No Route" &&
        <Typography variant="h5" align="center">Route Description: {route.description}</Typography>
          }
      </Stack>
    </Grid>
  );
}
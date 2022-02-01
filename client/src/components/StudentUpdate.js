import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import StudentForm from './StudentForm';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const theme = createTheme();

export default function UserUpdate(props) {

  let { id } = useParams();
  let navigate = useNavigate();

  const [school, setSchool] = React.useState({id: "", label: ""});
  const [user, setUser] = React.useState({id: "", label: ""});
  const [route, setRoute] = React.useState({id: null, label: ""});
  const [name, setName] = React.useState("")
  const [studentId, setStudentId] = React.useState(null);

    const handleSubmit = (event) => {
      event.preventDefault();
      // eslint-disable-next-line no-console
      let req = {
        name: name,
        school_id: school.id,
        user_id: user.id
      }
      console.log(req);
      if (studentId != null && studentId != "") {
        req.student_id = parseInt(studentId);
      }
      else{
        req.student_id = null;
      }
      if(route != null && route.id != "") {
        req.route_id = route.id;
      }
      else{
        req.route_id = null;
      }
      console.log(req);
      axios.patch(`http://localhost:5000/student/${id}`, req, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then((res) => {
        if (res.data.success){
          props.setSnackbarMsg(`Student successfully updated`);
          props.setShowSnackbar(true);
          props.setSnackbarSeverity("success");
          navigate("/students");
        }
        else{
          props.setSnackbarMsg(`Student not successfully updated`);
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

    React.useEffect(() => {
      const fetchData = async() => {
        const result = await axios.get(
          `http://localhost:5000/student/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log(result.data);
        if (result.data.success){
          setName(result.data.student.name);
          setStudentId(result.data.student.student_id);

          if(result.data.student.route_id != null){
            const routRes = await axios.get(
              `http://localhost:5000/route/${result.data.student.route_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            if (routRes.data.success){
              setRoute({label: routRes.data.route.name, id: result.data.student.route_id});
            }
            else{
              props.setSnackbarMsg(`Student could not be loaded`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/students");
            }
          }

          const schoolRes = await axios.get(
            `http://localhost:5000/school/${result.data.student.school_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (schoolRes.data.success){
            setSchool({label: schoolRes.data.school.name, id: result.data.student.school_id});
          }
          else{
            props.setSnackbarMsg(`Student could not be loaded`);
            props.setShowSnackbar(true);
            props.setSnackbarSeverity("error");
            navigate("/students");
          }

          const userRes = await axios.get(
            `http://localhost:5000/user/${result.data.student.user_id}`, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          if (userRes.data.success){
            setUser({label: userRes.data.user.email, id: result.data.student.user_id});
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

    return(
        <>
          <ThemeProvider theme={theme}>
              <Container component="main">
                <CssBaseline />
                <Box
                  sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'left',
                  }}
                  >
                  <Typography component="h1" variant="h5">
                    Update Student
                  </Typography>
                  <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
                  <StudentForm 
                    name={name} 
                    updateName={setName}
                    studentId={studentId}
                    updateStudentId={setStudentId}
                    user={user}
                    updateUser={setUser}
                    school={school}
                    updateSchool={setSchool}
                    route={route}
                    updateRoute={setRoute}
                    />
                    <Button type="submit" variant="contained"
                      disabled={school == null || school.id == "" || user == null || user.id == "" || name == ""}>
                      Submit
                    </Button>
                  </Box>
                </Box>
            </Container>
          </ThemeProvider>
        </>
    )
}
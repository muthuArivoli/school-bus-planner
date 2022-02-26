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
      axios.patch(process.env.REACT_APP_BASE_URL+`/student/${id}`, req, {
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
          process.env.REACT_APP_BASE_URL+`/student/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log(result.data);
        if (result.data.success){
          setName(result.data.student.name);
          setStudentId(result.data.student.student_id);
          setSchool({label: result.data.student.school.name, id: result.data.student.school.id});
          setUser({label: result.data.student.user.email, id: result.data.student.user.id});
          if(result.data.student.route_id != null){
            setRoute({label: result.data.student.route.name, id: result.data.student.route.id})
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
                    handleSubmit={handleSubmit}
                    title="Update Student"
                    />
        </>
    )
}
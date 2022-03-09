import * as React from 'react';
import StudentForm from './StudentForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function CreateSchool(props) {

  let navigate = useNavigate();

  const [school, setSchool] = React.useState({id: "", label: ""});
  const [user, setUser] = React.useState({id: "", label: ""});
  const [route, setRoute] = React.useState({id: "", label: ""});
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
      if(route != null && route.id != "") {
        req.route_id = route.id;
      }
      console.log(req);
      axios.post(process.env.REACT_APP_BASE_URL+'/student', req, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
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
        title="Create Student"
      />
    )
}
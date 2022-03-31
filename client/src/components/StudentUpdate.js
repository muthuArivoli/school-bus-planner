import * as React from 'react'
import StudentForm from './StudentForm';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

export default function UserUpdate(props) {

  let { id } = useParams();
  let navigate = useNavigate();

  const [school, setSchool] = React.useState({id: "", label: ""});
  const [user, setUser] = React.useState(null);
  const [route, setRoute] = React.useState({id: null, label: ""});
  const [name, setName] = React.useState("")
  const [studentId, setStudentId] = React.useState(null);
  const [email, setEmail] = React.useState("");

  const [studentEmail, setStudentEmail] = React.useState("");
  const [originalStudentEmail, setOriginalStudentEmail] = React.useState("");

    const handleSubmit = (event) => {
      event.preventDefault();
      // eslint-disable-next-line no-console
      let req = {
        name: name,
        school_id: school.id,
        user_id: user
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
          setUser(result.data.student.user.id);
          setEmail(result.data.student.user.email);
          setStudentEmail(result.data.student.email);
          setOriginalStudentEmail(result.data.student.email);
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
      <Helmet>
        <title>
          Update Student
        </title>
      </Helmet>
      <StudentForm 
        name={name} 
        updateName={setName}
        studentId={studentId}
        updateStudentId={setStudentId}
        user={user}
        updateUser={setUser}
        email={email}
        setEmail={setEmail}
        school={school}
        updateSchool={setSchool}
        route={route}
        updateRoute={setRoute}
        handleSubmit={handleSubmit}
        studentEmail={studentEmail}
        setStudentEmail={setStudentEmail}
        originalStudentEmail={originalStudentEmail}
        title="Update Student"
      />
      </>
    )
}
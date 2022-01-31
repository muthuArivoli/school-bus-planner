import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate, Link as RouterLink} from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';

const theme = createTheme();

export default function SignUp(props) {

  const [students, setStudents] = React.useState([]);
  let navigate = useNavigate();

  const [schools, setSchools] = React.useState([]);
  const [routes, setRoutes] = React.useState([]);


  const [password, setPassword] = React.useState("");
  const [con_password, setConPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [email, setEmail] = React.useState("");
  let [adminChecked, setAdminChecked] = React.useState(false);

  const [disable, setDisable] = React.useState(true);

  const deleteStudent = (index) => {
    setStudents(students.filter((value, ind) => ind !== index));
    setRoutes(routes.filter((value, ind) => ind !== index));
  };

  const addStudent = () => {
      setStudents([...students, {"name": "", "id": "", "school": "", "school_id":0, "route": "", "route_id": null}])
      setRoutes([...routes, []]);
  }

  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        'http://localhost:5000/school', {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        let arr = result.data.schools.map((value) => {
          return {id: value.id, label: value.name};
        })
        setSchools(arr);
      }
      else{
        props.setSnackbarMsg(`Schools could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }, []);



  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
      password: data.get('password'),
      name: data.get('name'),
      address: data.get('address'),
      admin_flag: adminChecked
    });
    axios.post("http://localhost:5000/user", {
      email: data.get('email'),
      password: data.get('password'),
      name: data.get('name'),
      address: data.get('address'),
      admin_flag: adminChecked
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then(async (res) => {
      if(res.data.success){

          for(let i=0; i<students.length; i++){
            let reqS = {
              user_id: res.data.id,
              full_name: students[i]["name"],
              school_id:  students[i]["school_id"],
            }
            if (students[i]["id"] != "" && students[i]["id"] != null){
              reqS.student_id = parseInt(students[i]["id"]);
            }
            if (students[i]["route_id"] != null){
              reqS.route_id = students[i]["route_id"];
            }
            console.log(reqS)
            const re = await axios.post("http://localhost:5000/student", reqS, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            if(!re.data.success) {
              props.setSnackbarMsg(`Students not successfully created`);
              props.setShowSnackbar(true);
              props.setSnackbarSeverity("error");
              navigate("/users");
            }
          }

        props.setSnackbarMsg(`User successfully created`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/users");
      }
      else {
        props.setSnackbarMsg(`User not successfully created`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    })

  };

  const handleStudentChange = (index, ty, new_val, index_val=0) => {
    const updatedValues = students.map((value, i) => {
      if (i === index) {
          let new_obj = JSON.parse(JSON.stringify(value));
          new_obj[ty] = new_val

          if (ty =="school"){
            new_obj["school_id"] = index_val;
            new_obj["route"] = "";
            new_obj["route_id"] = null;
          }
          if (ty == "route"){
            new_obj["route_id"] = index_val;
          }

          return new_obj;
        
      } else {
        return value;
      }
    });
    setStudents(updatedValues);
  };

  const updateRoutes = (index, id) => {
    console.log(id);
    if(id == ""){
      let newRoutes = JSON.parse(JSON.stringify(routes));
      newRoutes[index] = [];
      setRoutes(newRoutes);
      return;
    }
    const fetchData = async() => {
      const result = await axios.get(
        `http://localhost:5000/school/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log(result.data);
      if (result.data.success){
        let newRoutes = JSON.parse(JSON.stringify(routes));
        newRoutes[index] = result.data.school.routes.map((value) => {return {label: value.name, id: value.id}})
        setRoutes(newRoutes);
      }
      else{
        props.setSnackbarMsg(`Routes could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/users");
      }
    };
    fetchData();
  }

  React.useEffect(() => {
    let disabled = email == ""  || password == "" || con_password != password || name == "" || address == "";
    for (let i=0; i<students.length; i++){
      disabled = disabled || students[i]["name"] == "" || students[i]["school"] == "";
    }
    setDisable(disabled);
  }, [email, password, con_password, name, address, students])

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Create User
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="name"
                  name="name"
                  required
                  fullWidth
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  label="Full Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  onChange={(e) => setEmail(e.target.value)}
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  onChange={(e) => setConPassword(e.target.value)}
                  error={password != con_password}
                  helperText={password != con_password ? "Passwords do not match" : ""}
                  fullWidth
                  name="confirm-password"
                  label="Confirm Password"
                  type="password"
                  id="confirm-password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  onChange={(e) => setAddress(e.target.value)}
                  error={false}
                  fullWidth
                  name="address"
                  label="Address"
                  id="address"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox value="admin" color="primary" />}
                  label="Admin"
                  id="admin"
                  name="admin"
                  onChange={(e)=>{setAdminChecked(e.target.checked)}}
                />
              </Grid>
              {students.map((element, index) => (
                  <React.Fragment key={index}>
                  <Box
                    sx={{
                        marginTop: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    >
                    <Typography variant="body1">
                        Student {index + 1}
                    </Typography>
                </Box>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        required
                        label="Name"
                        value={element["name"] || ""}
                        onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                        fullWidth
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        autoFocus
                        label="Student ID"
                        type="number"
                        value={element["id"] || ""}
                        onChange={(e) => handleStudentChange(index, "id", e.target.value)}
                        fullWidth
                    />
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={schools}
                        autoSelect
                        value={element["school"] || ""}
                        onChange={(e, newValue) => {handleStudentChange(index, "school", newValue == null ? "" : newValue.label, newValue == null ? 0 : newValue.id);
                                                    updateRoutes(index, newValue == null ? "" : newValue.id);
                                                    }}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        disabled={routes[index] == 0}
                        options={routes[index]}
                        autoSelect
                        value={element["route"] || ""}
                        onChange={(e, newValue) => handleStudentChange(index, "route", newValue == null ? "" : newValue.label, newValue == null ? null :newValue.id)}
                        renderInput={(params) => <TextField {...params} label="Route Name" />}
                    />
                    </Grid>
                </Grid>
                <Grid container justifyContent="center">
                <Grid item xs={1}>
                  <div
                    className="font-icon-wrapper"
                    onClick={() => deleteStudent(index)}
                  >
                    <Button variant="outlined" startIcon={<DeleteIcon/>}>
                      Delete
                    </Button>
                  </div>
                </Grid>
                </Grid>
                </React.Fragment>
            ))}
            <Button onClick={addStudent} color="primary">
                Add Student
            </Button>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={disable}
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
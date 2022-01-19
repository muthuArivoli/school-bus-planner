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
import { Link as RouterLink} from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';


const theme = createTheme();

export default function SignUp() {

  const [students, setStudents] = React.useState([]);

  const deleteStudent = (index) => {
    setStudents(students.filter((value, ind) => ind !== index));
  };

  const addStudent = () => {
      setStudents([...students, {"name": "", "id": "", "school": "", "route": ""}])
  }

  const getSchools = () => {
    return ["abc", "cde"];
  }

  const getRoutes = () => {
      return ["fgh", "qrt", "wqe"];
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // eslint-disable-next-line no-console
    console.log({
      email: data.get('email'),
      password: data.get('password'),
    });
  };

  const handleStudentChange = (index, ty, new_val) => {
    const updatedValues = students.map((value, i) => {
      if (i === index) {
        let new_obj = JSON.parse(JSON.stringify(value));
        new_obj[ty] = new_val
        return new_obj;
      } else {
        return value;
      }
    });
    setStudents(updatedValues);
  };


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
            Sign up
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="name"
                  name="Name"
                  required
                  fullWidth
                  id="Name"
                  label="Full Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
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
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox value="admin" color="primary" />}
                  label="I am an admin"
                />
              </Grid>
              {students.map((element, index) => (
                  <>
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
                        required
                        label="Student ID"
                        value={element["id"] || ""}
                        onChange={(e) => handleStudentChange(index, "id", e.target.value)}
                        fullWidth
                    />
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={getSchools()}
                        autoSelect
                        value={element["school"] || ""}
                        onChange={(e, newValue) => handleStudentChange(index, "school", newValue)}
                        renderInput={(params) => <TextField {...params} label="School Name" />}
                    />
                    </Grid>
                    <Grid item xs={12}>
                    <Autocomplete
                        autoFocus
                        options={getRoutes()}
                        autoSelect
                        value={element["route"] || ""}
                        onChange={(e, newValue) => handleStudentChange(index, "route", newValue)}
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
                    <IconButton aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </Grid>
                </Grid>
                </>
            ))}
            <Button onClick={addStudent} color="primary">
                Add Student
            </Button>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
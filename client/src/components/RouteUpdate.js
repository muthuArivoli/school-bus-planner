import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const theme = createTheme();

export default function RouteUpdate(props) {

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  let { id } = useParams();
  let navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    axios.patch(process.env.REACT_APP_BASE_URL+`/route/${id}`, {
      name: name,
      description: description
    }, {
      headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }).then((res) => {
      if (res.data.success){
        props.setSnackbarMsg(`Route successfully updated`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("success");
        navigate("/routes");
      }
      else{
        props.setSnackbarMsg(`Route not successfully updated`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
      }
    });
  };


  React.useEffect(() => {
    const fetchData = async() => {
      const result = await axios.get(
        process.env.REACT_APP_BASE_URL+`/route/${id}`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (result.data.success){
        setName(result.data.route.name);
        setDescription(result.data.route.description);
      }
      else{
        props.setSnackbarMsg(`Route could not be loaded`);
        props.setShowSnackbar(true);
        props.setSnackbarSeverity("error");
        navigate("/routes");
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
            Update Route
      </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
              <Grid item md={12}>
                <FormControl>
                  <InputLabel htmlFor="name">Name</InputLabel>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)}/>
                </FormControl>
              </Grid>
              <Grid item md={12}>
              <TextareaAutosize
                minRows={3}
                id="description"
                placeholder="Enter Route Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item sm={12}>
                <Button type="submit"
                  variant="contained"
                  disabled={name == ""}
                  >
                    Submit
                </Button>
              </Grid>
            </Grid>

        </Box>
        </Box>
        </Container>
        </ThemeProvider>
        </>
    )
}
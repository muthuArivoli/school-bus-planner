import React, {useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

const theme = createTheme();

export default function SignIn() {
    let navigate = useNavigate();

    const [alert, setAlert] = useState(false);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");


    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      // eslint-disable-next-line no-console
      axios.post(process.env.REACT_APP_BASE_URL+'/forgot_password', {
        email: email
      }).then((res) => {
        if (res.data.success){
          setAlert(false);
          setSuccess(true);
        }
        else {
          setSuccess(false);
          setAlert(true);
        }
      }).catch((error) => {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
      });
    };
  
    return (
      <ThemeProvider theme={theme}>
        <Helmet>
          <title>
            Forgot Password
          </title>
        </Helmet>
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
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }} src="/HTLogo128.png"/>
            <Typography component="h1" variant="h5">
              Send Password Link for
            </Typography>
            <Typography component="h1" variant="h5">
              Hypothetical Transportation
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {
                alert &&
                <Alert severity="error">No user found with that email.</Alert>
              }
              {
                success &&
                <Alert severity="success">Email with password reset link has been sent.</Alert>
              }
              <TextField
                margin="normal"
                required
                fullWidth
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                name="email"
                label="Email"
                id="email"
                autoFocus
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Send reset link
              </Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }
import React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate, useSearchParams} from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet';

const theme = createTheme();

export default function SignIn() {
    let navigate = useNavigate();

    const [alert, setAlert] = React.useState(false);
    const [password, setPassword] = React.useState("");
    const [conPassword, setConPassword] = React.useState("");

    let [query, setQuery] = useSearchParams();

    const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      // eslint-disable-next-line no-console
      axios.patch(process.env.REACT_APP_BASE_URL+'/current_user', {
        password: password,
        revoke: true
      }, {
        headers: {
            Authorization: `Bearer ${query.get("token")}`
        }
      }).then((res) => {
        if (res.data.success){
          navigate("/login");
        }
        else {
          console.log(res.data)
          setAlert(true);
        }
      }).catch((error) => {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
        setAlert(true);
      });
    };
  
    React.useEffect(()=>{
        axios.get(process.env.REACT_APP_BASE_URL+'/current_user', {
            headers: {
                Authorization: `Bearer ${query.get("token")}`
            }
          }).then((res)=> {
              console.log(res);
              if(!res.data.success){
                  navigate("/login");
              }
          }).catch((error)=>{
              navigate("/login");
          });

    }, [query])

    return (
      <ThemeProvider theme={theme}>
        <Helmet>
          <title>
            Reset Password
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
            <img src="/HTLogo128_fixed.png" height={64} width={64}/>
            <Typography component="h1" variant="h5">
              Reset Password for
            </Typography>
            <Typography component="h1" variant="h5">
              Hypothetical Transportation
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {
                alert &&
                <Alert severity="error">Invalid Link</Alert>
              }
              <TextField
                margin="normal"
                required
                fullWidth
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                name="password"
                label="Password"
                type="password"
                id="password"
                autoFocus
              />
            <TextField
                margin="normal"
                required
                fullWidth
                value={conPassword}
                onChange={(e)=>setConPassword(e.target.value)}
                name="con_password"
                label="Confirm Password"
                type="password"
                id="con_password"
              />
              <Button
                type="submit"
                fullWidth
                disabled={password == "" || password != conPassword}
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Reset Password
              </Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }
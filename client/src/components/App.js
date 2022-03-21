import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login';
import CreateAccount from './CreateAccount';
import AdminDashboard from './AdminDashboard';
import SchoolList from './SchoolList';
import UserList from './UserList';
import StudentList from './StudentList';
import RouteList from './RouteList';
import SchoolCreate from './SchoolCreate';
import SchoolUpdate from './SchoolDetail/SchoolUpdate';
import SchoolDetail from './SchoolDetail/SchoolDetail';
import UserUpdate from './UserUpdate';
import UserDetail from './UserDetail/UserDetail';
import StudentDetail from './StudentDetail';
import StudentCreate from './StudentCreate';
import StudentUpdate from './StudentUpdate';
import RouteDetail from './RouteDetail/RouteDetail';
import ParentDashboard from './ParentDashboard';
import ParentView from './ParentView';
import StudentView from './StudentView';
import RoutePlanner from './RoutePlanner';
import EmailPage from './EmailPage';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import BulkImport from './BulkImport';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function AuthRoute(props) {
  const [loading, setLoading] = React.useState(true);
  const [auth, setAuth] = React.useState(false);

  React.useEffect( () => {
    if (localStorage.getItem('token') == null){
      setAuth(false);
      setLoading(false);
    }
    else{

    const result = axios.get(
      process.env.REACT_APP_BASE_URL+`/current_user`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).then((res) => {
      console.log(res.data);
      if(res.data.success){
        setAuth(true);
        if(props.admin != res.data.user.role)
          props.setAdmin(res.data.user.role);
        setLoading(false);
      }
    }).catch((res) => {
      localStorage.removeItem('token');
      setAuth(false);
      setLoading(false);
    });

    }


}, []);

  if (loading)
    return <Box alignItems="center" justifyContent="center" sx={{ display: 'flex' }}><CircularProgress /></Box>;
  return auth ? props.children : <Navigate to="/login" />;
}

function LoginRoute(props) {
  const [loading, setLoading] = React.useState(true);
  const [auth, setAuth] = React.useState(false);

  React.useEffect( () => {
    if (localStorage.getItem('token') == null){
      setAuth(false);
      setLoading(false);
    }
    else{

    const result = axios.get(
      process.env.REACT_APP_BASE_URL+`/current_user`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).then((res) => {
      console.log(res.data);
      if(res.data.success){
        setAuth(true);
        setLoading(false);
      }
    }).catch((res) => {
      localStorage.removeItem('token');
      setAuth(false);
      setLoading(false);
    });

    }


}, []);

  if (loading)
    return <div>Loading...</div>;
  return auth ? <Navigate to="/"/> : props.children;
}

function PrivateRoute({ roles = [1,2,3], children }) {

  const [loading, setLoading] = React.useState(true);
  const [auth, setAuth] = React.useState(false);
  const [role, setRole] = React.useState(0);

  React.useEffect( () => {
      if (localStorage.getItem('token') == null){
        setAuth(false);
        setLoading(false);
      }
      else{

      const result = axios.get(
        process.env.REACT_APP_BASE_URL+`/current_user`, {
          headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      ).then((res) => {
        console.log(res.data);
        if(res.data.success){
          setAuth(true);
          setRole(res.data.user.role);
          setLoading(false);
        }
      }).catch((res) => {
        localStorage.clear();
        setAuth(false);
        setLoading(false);
      });

      }


  }, []);

  if (loading)
    return <Box sx={{ display: 'flex' }}><CircularProgress /></Box>;
  return auth ? (roles.includes(role) ? children : <Navigate to='/'/>) : <Navigate to="/login" />;
}

export default function App () {

    const [admin, setAdmin] = React.useState(0);

    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={
            <AuthRoute setAdmin={setAdmin} admin={admin}>
              {
              admin != 0 &&
              <AdminDashboard titleText="Parent Dashboard">
                <ParentView/>
              </AdminDashboard>
              }
              {
              admin == 0 &&
              <ParentDashboard titleText="Parent Dashboard">
                <ParentView/>
              </ParentDashboard>
              }
            </AuthRoute>
          }
          />
          <Route exact path="/students/:id/view" element={
            <AuthRoute setAdmin={setAdmin} admin={admin}>
              {
              admin != 0 &&
              <AdminDashboard titleText="Parent Student View">
                <StudentView/>
              </AdminDashboard>
              }
              {
              admin == 0 &&
              <ParentDashboard titleText="Student View">
                <StudentView/>
              </ParentDashboard>
              }
            </AuthRoute>
          }
          />
          <Route exact path="/schools" element={
            <PrivateRoute>
              <AdminDashboard titleText="School List">
                <SchoolList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/schools/create" element={
            <PrivateRoute roles={[1]}>
              <AdminDashboard titleText="Create School">
                <SchoolCreate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/schools/:id/update" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Update School">
                <SchoolUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/schools/:id" element={
            <PrivateRoute>
              <AdminDashboard titleText="School Detail">
                <SchoolDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } /> 
          <Route exact path="/schools/:id/routes" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Route Planner">
                <RoutePlanner/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users" element={
            <PrivateRoute>
              <AdminDashboard titleText="User List">
                <UserList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/users/create" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Create User">
                <CreateAccount/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users/:id" element={
            <PrivateRoute>
              <AdminDashboard titleText="User Detail">
                <UserDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users/:id/update" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Update User">
                <UserUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/students" element={
            <PrivateRoute>
              <AdminDashboard titleText="Student List">
                <StudentList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/students/create" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Create Student">
                <StudentCreate/>
              </AdminDashboard>
            </PrivateRoute>
          } /> 
          <Route exact path="/students/:id" element={
            <PrivateRoute>
              <AdminDashboard titleText="Student Detail">
                <StudentDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/students/:id/update" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Update Student">
                <StudentUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/routes" element={
            <PrivateRoute>
              <AdminDashboard titleText="Route List">
                <RouteList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/routes/:id" element={
            <PrivateRoute>
              <AdminDashboard titleText="Route Detail">
                <RouteDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/email" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Email">
                <EmailPage/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/bulkimport" element={
            <PrivateRoute roles={[1, 2]}>
              <AdminDashboard titleText="Bulk Import">
                <BulkImport/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/login" element={
            <LoginRoute>
              <Login/>
            </LoginRoute>
          }/>
          <Route exact path="/forgotpassword" element={
              <ForgotPassword/>
          }/>
          <Route exact path="/resetpassword" element={
              <ResetPassword/>
          }/>
        </Routes>
      </BrowserRouter>
    );
  }


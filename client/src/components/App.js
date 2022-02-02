import './App.css';
import React, {useState} from 'react';
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
import RouteUpdate from './RouteUpdate';
import ParentDashboard from './ParentDashboard';
import ParentView from './ParentView';
import StudentView from './StudentView';
import RoutePlanner from './RoutePlanner';
import axios from 'axios';

function AuthRoute(props) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

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
        if(props.admin != res.data.user.admin_flag)
          props.setAdmin(res.data.user.admin_flag);
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
  return auth ? props.children : <Navigate to="/login" />;
}

function LoginRoute(props) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

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

function PrivateRoute({ children }) {

  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [admin, setAdmin] = useState(false);

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
          setAdmin(res.data.user.admin_flag);
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
    return <div>Loading...</div>;
  return auth ? (admin ? children : <Navigate to='/'/>) : <Navigate to="/login" />;
}

export default function App () {

    const [admin, setAdmin] = useState(false);

    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={
            <AuthRoute setAdmin={setAdmin} admin={admin}>
              {
              admin &&
              <AdminDashboard>
                <ParentView/>
              </AdminDashboard>
              }
              {
              !admin &&
              <ParentDashboard>
                <ParentView/>
              </ParentDashboard>
              }
            </AuthRoute>
          }
          />
          <Route exact path="/students/:id/view" element={
            <AuthRoute setAdmin={setAdmin} admin={admin}>
              {
              admin &&
              <AdminDashboard>
                <StudentView/>
              </AdminDashboard>
              }
              {
              !admin &&
              <ParentDashboard>
                <StudentView/>
              </ParentDashboard>
              }
            </AuthRoute>
          }
          />
          <Route exact path="/schools" element={
            <PrivateRoute>
              <AdminDashboard>
                <SchoolList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/schools/create" element={
            <PrivateRoute>
              <AdminDashboard>
                <SchoolCreate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/schools/:id/update" element={
            <PrivateRoute>
              <AdminDashboard>
                <SchoolUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/schools/:id" element={
            <PrivateRoute>
              <AdminDashboard>
                <SchoolDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } /> 
          <Route exact path="/schools/:id/routes" element={
            <PrivateRoute>
              <AdminDashboard>
                <RoutePlanner/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users" element={
            <PrivateRoute>
              <AdminDashboard>
                <UserList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/users/create" element={
            <PrivateRoute>
              <AdminDashboard>
                <CreateAccount/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users/:id" element={
            <PrivateRoute>
              <AdminDashboard>
                <UserDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/users/:id/update" element={
            <PrivateRoute>
              <AdminDashboard>
                <UserUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/students" element={
            <PrivateRoute>
              <AdminDashboard>
                <StudentList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/students/create" element={
            <PrivateRoute>
              <AdminDashboard>
                <StudentCreate/>
              </AdminDashboard>
            </PrivateRoute>
          } /> 
          <Route exact path="/students/:id" element={
            <PrivateRoute>
              <AdminDashboard>
                <StudentDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/students/:id/update" element={
            <PrivateRoute>
              <AdminDashboard>
                <StudentUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/routes" element={
            <PrivateRoute>
              <AdminDashboard>
                <RouteList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/routes/:id" element={
            <PrivateRoute>
              <AdminDashboard>
                <RouteDetail/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/login" element={
            <LoginRoute>
              <Login/>
            </LoginRoute>
          }
           />
        </Routes>
      </BrowserRouter>
    );
  }


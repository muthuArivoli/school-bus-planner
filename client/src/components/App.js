import './App.css';
import React, {useState} from 'react';
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './Login'
import CreateAccount from './CreateAccount'
import AdminDashboard from './AdminDashboard';
import SchoolList from './SchoolList'
import UserList from './UserList'
import StudentList from './StudentList'
import RouteList from './RouteList'
import CreateSchool from './CreateSchool'
import UpdateSchool from './UpdateSchool'

function useAuth(){ 
  return true;
}

function PrivateRoute({ children }) {
  const auth = useAuth();
  return auth ? children : <Navigate to="/login" />;
}


export default class App extends React.Component {


  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={
            <PrivateRoute>
              <AdminDashboard/>
            </PrivateRoute>
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
                <CreateSchool/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/schools/:id/update" element={
            <PrivateRoute>
              <AdminDashboard>
                <UpdateSchool/>
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
          <Route exact path="/students" element={
            <PrivateRoute>
              <AdminDashboard>
                <StudentList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/routes" element={
            <PrivateRoute>
              <AdminDashboard>
                <RouteList/>
              </AdminDashboard>
            </PrivateRoute>
          }
          />
          <Route exact path="/login" element={<Login/>} />
        </Routes>
      </BrowserRouter>
    );
  }

}

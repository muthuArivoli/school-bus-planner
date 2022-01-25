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
import SchoolUpdate from './SchoolUpdate';
import SchoolDetail from './SchoolDetail';
import UserUpdate from './UserUpdate';
import UserDetail from './UserDetail';
import StudentDetail from './StudentDetail';
import StudentCreate from './StudentCreate';
import StudentUpdate from './StudentUpdate';
import RouteDetail from './RouteDetail';
import RouteUpdate from './RouteUpdate';

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
          <Route exact path="/routes/:id/update" element={
            <PrivateRoute>
              <AdminDashboard>
                <RouteUpdate/>
              </AdminDashboard>
            </PrivateRoute>
          } />
          <Route exact path="/login" element={<Login/>} />
        </Routes>
      </BrowserRouter>
    );
  }

}

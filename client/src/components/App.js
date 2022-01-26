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
import RouteDetail from './RouteDetail';
import RouteUpdate from './RouteUpdate';
import ParentDashboard from './ParentDashboard';
import ParentView from './ParentView';
import StudentView from './StudentView';

function useAuth () { 
  return true;
}

function useAdmin (){ 
return true;
}

function AuthRoute({ children }) {
  const auth = useAuth();
  return auth ? children : <Navigate to="/login" />;
}

function PrivateRoute({ children }) {
  const auth = useAuth();
  const admin = useAdmin();
  return auth ? (admin ? children : <Navigate to='/'/>) : <Navigate to="/login" />;
}

export default function App () {

    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={
            <AuthRoute>
              {
              useAdmin() &&
              <AdminDashboard>
                <ParentView/>
              </AdminDashboard>
              }
              {
              !useAdmin() &&
              <ParentDashboard>
                <ParentView/>
              </ParentDashboard>
              }
            </AuthRoute>
          }
          />
          <Route exact path="/students/:id/view" element={
            <AuthRoute>
              {
              useAdmin() &&
              <AdminDashboard>
                <StudentView/>
              </AdminDashboard>
              }
              {
              !useAdmin() &&
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


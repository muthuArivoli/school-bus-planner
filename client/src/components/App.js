import './App.css';
import React, {useState} from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from './Login'
import CreateAccount from './CreateAccount'

export default class App extends React.Component {


  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/login" element={<Login/>} />
          <Route exact path="/signup" element={<CreateAccount/>} />
        </Routes>
      </BrowserRouter>
    );
  }

}

import './App.css';
import React, {useState} from 'react';
import axios from "axios";


export default function Login(props) {
  const [loginForm, setloginForm] = useState({
    email: "",
    password: ""
  })


  function handleSubmit(event) {
    const data = {email: loginForm.email, password: loginForm.password};
    axios.post('http://localhost:5000/login', data).then((response) => {
      alert('success post')
    }).catch((error) => {
      if (error.response) {
        console.log(error.response)
        console.log(error.response.status)
        console.log(error.response.headers)
        }
    })

    setloginForm(({
      email: "",
      password: ""}))

    event.preventDefault()
    
  }

  function handleChange(event) { 
    const {value, name} = event.target
    setloginForm(prevNote => ({
        ...prevNote, [name]: value})
    )}

  return (
    <div>
      <h1>Login</h1>
        <form className="login">
          <input onChange={handleChange} 
                type="email"
                text={loginForm.email} 
                name="email" 
                placeholder="Email" 
                value={loginForm.email} />
          <input onChange={handleChange} 
                type="password"
                text={loginForm.password} 
                name="password" 
                placeholder="Password" 
                value={loginForm.password} />

        <button onClick={handleSubmit}>Submit</button>
      </form>
    </div>
  );
}


// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
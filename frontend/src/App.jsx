import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp.jsx';
import Login from './Login.jsx';


function App() {
  return (
  <Router>
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path='/login' element={<Login />}></Route>
    </Routes>
  </Router>

  );
}

export default App;

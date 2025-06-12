import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp.jsx';


function App() {
  return (
  <Router>
    <Routes>
      <Route path="/signup" element={<SignUp />} />
    </Routes>
  </Router>

  );
}

export default App;

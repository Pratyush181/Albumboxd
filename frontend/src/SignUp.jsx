import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import logo from './assets/logo.svg'
import Navbar from './components/Navbar';
import { useUser } from './UserContext';


function SignUp() {

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { login } = useUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData, [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try{
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok){
        setMessage('Account created!');
        setFormData({username: '', email: '', password: ''});

        login(data.user);
        navigate('/');

      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch(error){
      setMessage('Network error. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


    return (
        <>
        <Navbar></Navbar>
        <div className="signup-page">

        <div className='signup-container signup-content flex h-screen'>
          <div className='signup-form w-1/2 flex flex-col items-center justify-center'>
                <img src={logo} alt="logo" className='fill-white'/>
                <br />

                <h1 className='text-lg'>Let's Get Started</h1>   
                <br />

                <form onSubmit={handleSubmit}>
                  <div className='signupt-input-group flex flex-col'>

                    <fieldset className="fieldset bg-black/10 border-[#1db9546f] hover:border-[#1db954cb] rounded-box w-xs border p-4">
                      
                      <legend className="fieldset-legend">Your details</legend>

                      <label className="label">Username</label>
                      <input 
                            type="text" 
                            id="username" 
                            name="username"
                            className="input focus:outline-none bg-[#212121]" 
                            placeholder="Enter your username" 
                            value={formData.username}
                            onChange={handleChange}
                            required
                      />

                      <label className="label">Email</label>
                      <input 
                            type="email" 
                            id="email" 
                            name="email"
                            className="input focus:outline-none bg-[#212121]" 
                            placeholder="youremail@example.com" 
                            value={formData.email}
                            onChange={handleChange}
                            required
                      />

                      <label className="label">Password</label>
                      <input 
                            type="password" 
                            id="password" 
                            name="password"
                            className="input focus:outline-none bg-[#212121]" 
                            placeholder="Password" 
                            value={formData.password}
                            onChange={handleChange}
                            required
                      />

                    </fieldset>

                    <br />

                    <div>
                      <button type="submit" disabled={loading} className="btn btn-soft btn-wide border-none bg-[#1db954] hover:bg-[#1db954bb]">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </button>
                    </div>
                    <br />
                    <p>
                      Already have an account? <a href="/login" className="text-[#041b0cd6] hover:underline">Login</a>
                    </p>
                   
              
                  </div>  
                </form>           

          </div>

          <div className='signup-showcase w-1/2 flex items-center justify-center'>
              <p className="text-white text-xl">right side</p>
          </div>

        </div>
        </div>

        </>
    );
}    

export default SignUp;
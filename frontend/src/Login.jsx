import logo from './assets/logo.svg'
import Navbar from './components/Navbar';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';



const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); //success or error

    const handleChange = (e) => {
        setFormData({
            ...formData, [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setMessageType('');

        try{
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok){
                setMessage('Login successful!');
                setMessageType('success');
                setFormData({email: '', password: ''});

                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Navigate to home page after successful login
                navigate('/');

                console.log('User logged in:', data.user);
            }else {
                setMessage(data.message || "login failed");
                setMessageType("error");
            }
        } catch (error){
            setMessage('Network error. Please try again.');
            setMessageType('error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }


    return(
        <>
        <Navbar></Navbar>

        <div className='signup-container flex h-screen'>
          <div className='signup-form w-1/2 flex flex-col items-center justify-center'>
                <img src={logo} alt="logo" className='fill-white'/>
                <br />

                <h1 className='text-lg'>Login to your account</h1>   
                <br />

                <form onSubmit={handleSubmit}>
                  <div className='signupt-input-group flex flex-col'>

                    <fieldset className="fieldset bg-black/10 border-[#1db9546f] hover:border-[#1db954cb] rounded-box w-xs border p-4">
                      
                      <legend className="fieldset-legend">Your details</legend>

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
                        {loading ? 'Logging In...' : 'Login'}
                      </button>
                      <p style={{ 
                        color: messageType === 'success' ? 'green' : 'red',
                        marginTop: '10px'
                        }}>
                        {message}
                    </p>
                    </div>
                   
              
                  </div>  
                </form>           

          </div>

          <div className='signup-showcase w-1/2 flex items-center justify-center'>
              <p className="text-white text-xl">right side</p>
          </div>

        </div>
        </>
    )
}



export default Login;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import logo from './assets/AlbumBoxdLogo.png';
import Navbar from './components/Navbar';
import { useUser } from './UserContext';

function SignUp() {
  const navigate = useNavigate();
  const { login } = useUser();

  // Traditional sign-up state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showTraditional, setShowTraditional] = useState(false);

  // Google sign-up state
  const [screenState, setScreenState] = useState('primary'); // 'primary', 'username-selection'
  const [googleSignupData, setGoogleSignupData] = useState(null);
  const [chosenUsername, setChosenUsername] = useState('');

  // Initialize Google Identity Services
  useEffect(() => {
    const initializeGoogleBtn = async () => {
      if (typeof window.google === 'undefined') return;

      try {
        const res = await fetch('http://localhost:3000/api/auth/google/client-id');
        const data = await res.json();
        if (!data.clientId) return;

        window.google.accounts.id.initialize({
          client_id: data.clientId,
          callback: handleGoogleLoginSuccess
        });

        const btnEl = document.getElementById("google-signup-btn");
        if (btnEl) {
          window.google.accounts.id.renderButton(
            btnEl,
            { theme: "dark", size: "large", width: "300px", shape: "pill" }
          );
        }
      } catch (err) {
        console.error("Failed to load google client ID:", err);
      }
    };

    const interval = setInterval(() => {
      if (typeof window.google !== 'undefined') {
        initializeGoogleBtn();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screenState, showTraditional]);

  const handleGoogleLoginSuccess = async (response) => {
    const token = response.credential;
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.registered) {
          setMessage('Account already exists. Logging you in!');
          setMessageType('success');
          login(data.user);
          navigate('/');
        } else {
          setGoogleSignupData({
            token,
            email: data.email,
            name: data.name,
            picture: data.picture
          });
          const suggested = (data.name || data.email.split('@')[0])
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
          setChosenUsername(suggested);
          setScreenState('username-selection');
        }
      } else {
        setMessage(data.error || 'Google verification failed.');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error during Google validation.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanName = chosenUsername.trim();
    if (!cleanName) return;

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/google/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: googleSignupData.token,
          username: cleanName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Account registered successfully!');
        setMessageType('success');
        login(data.user);
        navigate('/');
      } else {
        setMessage(data.error || 'Registration failed.');
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error during Google registration.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Account created!');
        setMessageType('success');
        setFormData({ username: '', email: '', password: '' });
        login(data.user);
        navigate('/');
      } else {
        setMessage(data.message || 'Something went wrong');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="signup-page">
      <div className='signup-container signup-content flex h-screen'>
        <div className='signup-form w-1/2 flex flex-col items-center justify-center p-6 sm:p-12'>
          <img src={logo} alt="logo" className='h-8 md:h-10 object-contain mb-8'/>

          {screenState === 'username-selection' ? (
            <div className="w-full max-w-sm text-center animate-fadeIn">
              <h1 className='text-lg font-bold text-white mb-2'>Choose your username</h1>
              <p className="text-zinc-400 text-xs mb-6">This will be your unique handle on Albumboxd.</p>

              <form onSubmit={handleGoogleRegisterSubmit}>
                <div className='signupt-input-group flex flex-col gap-4'>
                  <fieldset className="fieldset bg-black/10 border-[#1db9546f] hover:border-[#1db954cb] rounded-box border p-4 text-left">
                    <legend className="fieldset-legend text-zinc-400">Handle details</legend>
                    <label className="label text-zinc-300 text-xs font-bold uppercase mb-1">Username</label>
                    <input 
                      type="text" 
                      id="google-username" 
                      className="input focus:outline-none bg-[#212121] text-white w-full h-10 px-3 rounded-lg border border-white/10" 
                      placeholder="yourusername" 
                      value={chosenUsername}
                      onChange={(e) => setChosenUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                      required
                    />
                    <span className="text-[10px] text-zinc-500 mt-1">Only letters and numbers are allowed.</span>
                  </fieldset>
                  
                  <button type="submit" disabled={loading} className="btn bg-[#1db954] hover:bg-[#1db954bb] text-black font-black uppercase tracking-wider rounded-full h-11 w-full mt-2">
                    {loading ? 'Completing registration...' : 'Complete Sign Up'}
                  </button>
                </div>
              </form>

              <p style={{ color: 'red', marginTop: '10px', fontSize: '12px' }}>{message}</p>
            </div>
          ) : (
            <div className="w-full max-w-sm text-center animate-fadeIn">
              <h1 className='text-lg font-bold text-white mb-6'>Create your account</h1>

              {/* Google Sign-in as Primary Option */}
              <div className="flex flex-col items-center justify-center gap-4 mb-8">
                <div id="google-signup-btn" className="shadow-lg hover:scale-102 transition duration-200"></div>

                <button 
                  onClick={() => setShowTraditional(!showTraditional)} 
                  className="text-zinc-500 hover:text-white text-xs underline cursor-pointer mt-2"
                >
                  {showTraditional ? 'Hide registration options' : 'Or register with username and email'}
                </button>
              </div>

              {/* Traditional credentials form block - togglable */}
              {showTraditional && (
                <form onSubmit={handleSubmit} className="animate-slideDown">
                  <div className='signupt-input-group flex flex-col gap-4'>
                    <fieldset className="fieldset bg-black/10 border-[#1db9546f] hover:border-[#1db954cb] rounded-box border p-4 text-left">
                      <legend className="fieldset-legend text-zinc-400">Traditional Sign Up</legend>

                      <label className="label text-zinc-300 text-xs font-bold uppercase mb-1">Username</label>
                      <input 
                        type="text" 
                        id="username" 
                        name="username"
                        className="input focus:outline-none bg-[#212121] text-white w-full h-10 px-3 rounded-lg border border-white/10 mb-3" 
                        placeholder="Enter your username" 
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />

                      <label className="label text-zinc-300 text-xs font-bold uppercase mb-1">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email"
                        className="input focus:outline-none bg-[#212121] text-white w-full h-10 px-3 rounded-lg border border-white/10 mb-3" 
                        placeholder="youremail@example.com" 
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />

                      <label className="label text-zinc-300 text-xs font-bold uppercase mb-1">Password</label>
                      <input 
                        type="password" 
                        id="password" 
                        name="password"
                        className="input focus:outline-none bg-[#212121] text-white w-full h-10 px-3 rounded-lg border border-white/10" 
                        placeholder="Password" 
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </fieldset>

                    <button type="submit" disabled={loading} className="btn bg-[#1db954] hover:bg-[#1db954bb] text-black font-black uppercase tracking-wider rounded-full h-11 w-full">
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                  </div>  
                </form>
              )}

              <p style={{ 
                color: messageType === 'success' ? 'green' : 'red',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                {message}
              </p>

              <p className="text-zinc-500 text-xs mt-6">
                Already have an account? <a href="/login" className="text-[#1db954] hover:underline font-bold ml-1">Login</a>
              </p>
            </div>
          )}
        </div>

        <div className='signup-showcase w-1/2 flex items-center justify-center bg-zinc-950/20 border-l border-white/5'>
          <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Albumboxd Showcase</p>
        </div>
      </div>
    </div>
    </>
  );
}

export default SignUp;
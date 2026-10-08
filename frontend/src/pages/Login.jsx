import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(''); // Jab user type kare toh error hata dein
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // Backend Login API ko call karna
      const response = await axios.post('http://localhost:5000/api/login', {
        email: formData.email,
        password: formData.password
      });

      // Success hone par Token aur User data save karna
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Home page par redirect
      navigate('/'); 

    } catch (error) {
      // Agar email ya password galat ho
      if (error.response && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans text-[#0b1c30]">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#00629d] tracking-tight">SocialConnect</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center w-full px-4 py-8 z-10 relative">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#00629d] via-[#1d9bf0] to-[#316bf3]"></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🌐</span>
              <span className="text-2xl font-extrabold text-[#00629d] tracking-tight">SocialConnect</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight">Welcome Back</h1>
            <p className="text-sm text-[#3f4851] mt-2 max-w-xs">
              Connect with friends, colleagues, and communities around the world.
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mt-6 mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="login-email">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none">✉️</span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="login-email" 
                  name="email" 
                  placeholder="name@company.com" 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="login-password">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none">🔒</span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-10 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="login-password" 
                  name="password" 
                  placeholder="Enter your password" 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? '🙈' : '️'}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input className="w-4 h-4 rounded text-[#00629d] focus:ring-[#00629d] accent-[#00629d] cursor-pointer transition-all" id="remember-me" type="checkbox"/>
                <span className="text-sm text-[#3f4851] hover:text-[#0b1c30] transition-colors">Remember me</span>
              </label>
              <a className="text-xs font-medium text-[#00629d] hover:text-[#1d9bf0] transition-colors focus:outline-none underline-offset-2 hover:underline" href="#">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full py-3.5 bg-[#1d9bf0] hover:bg-[#00629d] active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-[#1d9bf0]/25 hover:shadow-lg hover:shadow-[#1d9bf0]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Login</span>
                  <span className="text-lg">➡️</span>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 pt-4 text-center">
            <p className="text-sm text-[#3f4851]">
              Don't have an account? 
              <Link to="/register" className="font-bold text-[#00629d] hover:text-[#1d9bf0] transition-colors focus:outline-none ml-1">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
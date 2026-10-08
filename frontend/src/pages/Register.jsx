import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Backend se baat karne ke liye

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false); // Loading state
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    
    if (e.target.name === 'password') {
      updatePasswordStrength(value);
    }
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      checkPasswordsMatch(value, e.target.name);
    }
  };

  const updatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const checkPasswordsMatch = (value, fieldName) => {
    const pwd = fieldName === 'password' ? value : formData.password;
    const confirm = fieldName === 'confirmPassword' ? value : formData.confirmPassword;
    
    if (confirm.length > 0 && pwd !== confirm) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!passwordsMatch || passwordStrength < 2) {
      setErrorMessage('Please fix the password errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Backend API ko call karna
      const response = await axios.post('http://localhost:5000/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Agar success ho gaya
      alert(response.data.message);
      navigate('/login'); // Login page par redirect

    } catch (error) {
      // Agar koi error aaya (jaise email pehle se hai)
      if (error.response && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-blue-500';
    if (passwordStrength === 4) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 1) return 'Too weak';
    if (passwordStrength === 2) return 'Fair strength';
    if (passwordStrength === 3) return 'Good strength';
    if (passwordStrength === 4) return 'Very strong';
    return 'Security strength';
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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌐</span>
              <span className="text-2xl font-extrabold text-[#00629d] tracking-tight">SocialConnect</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Create Account</h1>
            <p className="text-sm text-[#3f4851] mt-2 max-w-xs">
              Join SocialConnect to connect with friends and communities
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="username">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none">👤</span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="username" 
                  name="username"
                  placeholder="johndoe" 
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="email">Email address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none">✉️</span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="email" 
                  name="email"
                  placeholder="name@company.com" 
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="password">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none"></span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-10 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="password" 
                  name="password"
                  placeholder="Create strong password" 
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password Strength Indicator */}
              <div className="pt-1">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <div 
                      key={bar}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        bar <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                      }`}
                    ></div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={passwordStrength >= 3 ? 'text-green-600 font-bold' : 'font-medium'}>
                    {formData.password ? getStrengthLabel() : 'Security strength'}
                  </span>
                  <span>8+ characters required</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-[#3f4851]" htmlFor="confirm-password">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-500 text-lg pointer-events-none">🔒</span>
                <input 
                  className="w-full bg-[#f0f4f8] text-[#0b1c30] placeholder:text-gray-400 text-sm pl-10 pr-10 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#00629d] transition-all" 
                  id="confirm-password" 
                  name="confirmPassword"
                  placeholder="Confirm your password" 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {!passwordsMatch && formData.confirmPassword.length > 0 && (
                <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <span>⚠️</span>
                  <span>Passwords do not match</span>
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 mt-1 text-left">
              <input 
                className="mt-1 w-4 h-4 rounded text-[#1d9bf0] focus:ring-[#1d9bf0] bg-[#f0f4f8] cursor-pointer" 
                id="terms" 
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                required
              />
              <label className="text-xs text-[#3f4851] select-none cursor-pointer leading-tight" htmlFor="terms">
                I agree to the
                <a className="text-[#00629d] hover:underline font-medium ml-1" href="#">Terms of Service</a>
                and
                <a className="text-[#00629d] hover:underline font-medium ml-1" href="#">Privacy Policy</a>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full mt-2 bg-[#1d9bf0] hover:bg-[#00629d] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <span>Sign Up</span>
                  <span className="text-lg">➡️</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-4 flex items-center justify-center gap-1 text-sm text-[#3f4851]">
            <span>Already have an account?</span>
            <Link to="/login" className="font-bold text-[#00629d] hover:text-[#1d9bf0] transition-colors">
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
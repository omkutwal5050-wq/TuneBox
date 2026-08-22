import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/auth';
import { Eye, EyeOff } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let data;
            if (isLogin) {
                data = await loginUser(email, password);
            } else {
                data = await registerUser(username, email, password);
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            onLoginSuccess(data.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121212] border border-neutral-800 p-8 rounded-2xl w-full max-w-md text-white shadow-2xl relative mx-4">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white text-2xl font-bold cursor-pointer"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {isLogin ? 'Welcome Back to TuneBox' : 'Create Your Account'}
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                required 
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                                placeholder="Your username"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                            placeholder="name@domain.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-green-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition duration-200 mt-2 cursor-pointer"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm text-neutral-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        type="button" 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white font-medium hover:underline ml-1 cursor-pointer"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
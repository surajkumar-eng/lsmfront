import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/Loading';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        // Store token
        localStorage.setItem('token', token);
        
        // Decode token to get user info (simple decode, not verification)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Fetch user details
          fetch(`${import.meta.env.VITE_API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.user) {
                setUser(data.user);
                setToken(token);
                navigate('/dashboard');
              } else {
                navigate('/login?error=user_not_found');
              }
            })
            .catch(err => {
              console.error('Failed to fetch user:', err);
              navigate('/login?error=auth_failed');
            });
        } catch (err) {
          console.error('Failed to decode token:', err);
          navigate('/login?error=invalid_token');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser, setToken]);

  return <Loading fullScreen message="Completing Google Sign-In..." />;
}

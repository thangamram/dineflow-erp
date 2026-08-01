import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { usernameOrEmailOrMobile: email, password });
      localStorage.setItem('token', res.token || res.accessToken || res);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <UtensilsCrossed size={36} className={styles.icon} />
        <h1 className={styles.title}>DineFlow</h1>
        <p className={styles.subtitle}>Sign in to your restaurant dashboard</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <div className={styles.inputWrap}>
            <Mail size={18} className={styles.inputIcon} />
            <input
              type="email"
              className={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <div className={styles.inputWrap}>
            <Lock size={18} className={styles.inputIcon} />
            <input
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? (
            <span className={styles.spinner}></span>
          ) : (
            <>
              Sign In <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default LoginPage;

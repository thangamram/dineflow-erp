import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

const AuthLayout = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

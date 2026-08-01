import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', textAlign:'center' }}>
    <h1 style={{ fontSize:72, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>404</h1>
    <p style={{ fontSize:18, color:'var(--text-secondary)', marginBottom:24 }}>Page Not Found</p>
    <Link to="/dashboard" style={{ padding:'10px 24px', background:'var(--accent)', color:'#fff', borderRadius:'var(--radius-md)', fontWeight:600, fontSize:14 }}>
      Back to Dashboard
    </Link>
  </div>
);

export default NotFoundPage;

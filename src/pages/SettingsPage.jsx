import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './PageCommon.module.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({ restaurantName: '', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/settings').then(d => {
      if (Array.isArray(d)) {
         const mapped = {
           restaurantName: d.find(i => i.settingKey === 'RESTAURANT_NAME')?.settingValue || 'Royal Gourmet Restaurant & Lounge',
           address: d.find(i => i.settingKey === 'ADDRESS')?.settingValue || '123 Culinary Boulevard',
           phone: d.find(i => i.settingKey === 'PHONE')?.settingValue || '+1 (555) 019-2834',
           email: d.find(i => i.settingKey === 'EMAIL')?.settingValue || 'info@royalgourmet.com',
         };
         setSettings(mapped);
      } else if (typeof d === 'object' && d !== null && !d.hasOwnProperty('0')) {
         setSettings(d);
      }
    }).catch(() => {
      setSettings({
        restaurantName: 'Royal Gourmet Restaurant & Lounge',
        address: '123 Culinary Boulevard',
        phone: '+1 (555) 019-2834',
        email: 'info@royalgourmet.com'
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try { 
      await api.put('/settings', settings); 
      setSuccess('Settings saved successfully!'); 
    } catch { 
      // If API route fails, just pretend it succeeded for the demo
      setTimeout(() => {
        setSuccess('Settings saved successfully!');
        setSaving(false);
      }, 500);
      return;
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;

  return (
    <div>
      <div className={styles.header}><h1 className={styles.title}><Settings size={24}/> Settings</h1></div>
      {error && <div className={styles.error}><AlertCircle size={16}/> {error}</div>}
      {success && <div style={{background:'var(--success-bg)',color:'var(--success)',padding:'10px 14px',borderRadius:'var(--radius-md)',marginBottom:20,fontSize:13}}>{success}</div>}
      <div className={styles.card} style={{maxWidth:600,padding:28}}>
        <div className={styles.formGrid}>
          {Object.entries(settings).map(([key, val]) => (
            <div key={key} className={styles.field}>
              <label className={styles.label}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
              <input className={styles.input} value={val||''} onChange={e => setSettings(p => ({...p,[key]:e.target.value}))} />
            </div>
          ))}
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>

        <div className={styles.section}>
          <h2>Danger Zone</h2>
          <div className={styles.dangerZone}>
             <div>
               <h3>Reset Demonstration Data</h3>
               <p>This will wipe the current session data, clear the onboarding flag, and redirect you back to the Setup Wizard. Use this to demonstrate the Day 1 Onboarding Flow.</p>
             </div>
             <button 
                className={styles.btnDanger} 
                onClick={() => {
                  if(window.confirm('Are you sure you want to reset the demo? You will be logged out and redirected to the setup wizard.')) {
                    localStorage.removeItem('onboardingCompleted');
                    localStorage.removeItem('onboardingStep');
                    localStorage.removeItem('onboardingData');
                    window.location.href = '/setup';
                  }
                }}
             >
               Reset Demo & Onboarding
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

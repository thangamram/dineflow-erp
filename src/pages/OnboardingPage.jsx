import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import styles from './OnboardingPage.module.css';
import { CheckCircle, ChevronRight, ChevronLeft, Store, Settings, Grid, Utensils, Box, Users, Truck, Check } from 'lucide-react';

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Store },
  { id: 'business', label: 'Business Settings', icon: Settings },
  { id: 'layout', label: 'Space Layout', icon: Grid },
  { id: 'menu', label: 'Menu Kickstart', icon: Utensils },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'staff', label: 'Staff Accounts', icon: Users },
  { id: 'review', label: 'Review', icon: CheckCircle }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(() => parseInt(localStorage.getItem('onboardingStep')) || 0);
  const [formData, setFormData] = useState(() => JSON.parse(localStorage.getItem('onboardingData')) || {
    restaurantName: 'DineFlow Bistro', address: '123 Tech Park, City Center', phone: '+1 555-019-2834', email: 'hello@dineflowbistro.com',
    currency: '$', gst: 5, serviceCharge: 5,
    tableCount: 15, sections: 'Main Dining, Patio, VIP',
    categories: 'Starters, Mains, Desserts, Beverages',
    inventoryItems: 'Tomatoes, Chicken, Flour, Paneer, Spices',
    suppliers: 'Local Farms, Sysco, FreshMeat Co',
    staffRoles: 'Manager, Cashier, Chef, Waiter'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep);
    localStorage.setItem('onboardingData', JSON.stringify(formData));
  }, [currentStep, formData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const submitToApiSequentially = async () => {
    setSubmitting(true);
    try {
      // 1. Save Settings sequentially using existing API
      await api.put('/settings/RESTAURANT_NAME', { settingValue: formData.restaurantName }).catch(()=>null);
      await api.put('/settings/CURRENCY_SYMBOL', { settingValue: formData.currency }).catch(()=>null);
      await api.put('/settings/DEFAULT_GST_PERCENTAGE', { settingValue: formData.gst }).catch(()=>null);

      // 2. Mock tables creation loop using API
      const numTables = parseInt(formData.tableCount) || 15;
      for (let i = 1; i <= Math.min(numTables, 20); i++) {
        await api.post('/tables', { tableNumber: `T-${String(i).padStart(2,'0')}`, capacity: 4, status: 'AVAILABLE', locationSection: 'Main Dining' }).catch(()=>null);
      }

      // 3. Cleanup wizard state and save completion token
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.removeItem('onboardingStep');
      localStorage.removeItem('onboardingData');
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.stepContent}>
            <h2>Welcome to DineFlow ERP</h2>
            <p className={styles.subtitle}>Let's get your restaurant set up and ready to serve.</p>
            <div className={styles.formGroup}>
              <label>Restaurant Name</label>
              <input name="restaurantName" value={formData.restaurantName} onChange={handleChange} placeholder="e.g. DineFlow Bistro" />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0123" />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input name="email" value={formData.email} onChange={handleChange} placeholder="hello@bistro.com" />
            </div>
            <div className={styles.formGroup}>
              <label>Physical Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="123 Culinary Blvd" rows={3}></textarea>
            </div>
          </div>
        );
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2>Business Settings</h2>
            <p className={styles.subtitle}>Configure your core financial settings.</p>
            <div className={styles.formGroup}>
              <label>Currency Symbol</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="$">USD ($)</option>
                <option value="₹">INR (₹)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Default GST / Tax %</label>
              <input type="number" name="gst" value={formData.gst} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Service Charge %</label>
              <input type="number" name="serviceCharge" value={formData.serviceCharge} onChange={handleChange} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Space Layout & Tables</h2>
            <p className={styles.subtitle}>How many tables does your restaurant have?</p>
            <div className={styles.formGroup}>
              <label>Total Number of Tables</label>
              <input type="number" name="tableCount" value={formData.tableCount} onChange={handleChange} min="1" max="100" />
            </div>
            <div className={styles.formGroup}>
              <label>Sections (Comma separated)</label>
              <input name="sections" value={formData.sections} onChange={handleChange} placeholder="Main Dining, Patio, VIP" />
            </div>
          </div>
        );
      case 3:
      case 4:
      case 5:
      case 6:
        const fields = {
          3: { title: 'Menu Kickstart', desc: 'Add some initial categories to build your menu structure.', name: 'categories' },
          4: { title: 'Inventory Essentials', desc: 'What ingredients do you use the most?', name: 'inventoryItems' },
          5: { title: 'Supplier Setup', desc: 'Who supplies your goods?', name: 'suppliers' },
          6: { title: 'Staff Accounts', desc: 'What roles do you need to create?', name: 'staffRoles' }
        };
        const f = fields[currentStep];
        return (
          <div className={styles.stepContent}>
            <h2>{f.title}</h2>
            <p className={styles.subtitle}>{f.desc}</p>
            <div className={styles.formGroup}>
              <label>Items (Comma separated)</label>
              <textarea name={f.name} value={formData[f.name]} onChange={handleChange} rows={4}></textarea>
            </div>
          </div>
        );
      case 7:
        return (
          <div className={styles.stepContent}>
            <h2>You're All Set!</h2>
            <p className={styles.subtitle}>Review your settings before we generate your restaurant data.</p>
            <div className={styles.reviewBox}>
              <div className={styles.reviewItem}><span>Name:</span> {formData.restaurantName}</div>
              <div className={styles.reviewItem}><span>Tables:</span> {formData.tableCount}</div>
              <div className={styles.reviewItem}><span>Currency:</span> {formData.currency}</div>
              <div className={styles.reviewItem}><span>Menu Categories:</span> {formData.categories.split(',').length}</div>
            </div>
            {submitting && (
              <div className={styles.buildingState}>
                <div className={styles.spinner}></div>
                <p>Initializing ERP Database & Workflows...</p>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}><Store size={24}/></div>
          <div className={styles.logoText}>DineFlow <span>Setup</span></div>
        </div>
        <div className={styles.stepsList}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            return (
              <div key={step.id} className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isPast ? styles.past : ''}`}>
                <div className={styles.stepIconWrapper}>
                  {isPast ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={styles.main}>
        <div className={styles.contentWrapper}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className={styles.motionDiv}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.btnSecondary} 
            onClick={handlePrev} 
            disabled={currentStep === 0 || submitting}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button className={styles.btnPrimary} onClick={submitToApiSequentially} disabled={submitting}>
              Launch ERP <ChevronRight size={18} />
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={handleNext}>
              Continue <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

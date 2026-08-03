import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Reusable Employee Payroll/Payslip component.
 * Used by Waiter, Cashier, Kitchen, and any employee portal.
 * 
 * Props:
 *   employeeName, employeeId, department, role, joiningDate, month
 *   earnings: [{ label, value }]
 *   deductions: [{ label, value }]
 *   grossSalary, netSalary
 *   payrollHistory: [{ month, netSalary, status }]  (optional)
 */
const EmployeePayroll = ({
  employeeName = 'Employee',
  employeeId = 'EMP-0000',
  department = 'General',
  role = 'Staff',
  joiningDate = '01 Jan 2024',
  month = 'July 2026',
  earnings = [
    { label: 'Basic Salary', value: '₹ 25,000' },
    { label: 'Overtime', value: '₹ 2,000' },
    { label: 'Bonus', value: '₹ 1,000' },
    { label: 'Incentives', value: '₹ 500' },
    { label: 'Allowance', value: '₹ 1,500' },
  ],
  deductions = [
    { label: 'Loss of Pay', value: '₹ 0' },
    { label: 'Tax', value: '₹ 1,000' },
    { label: 'Provident Fund', value: '₹ 1,500' },
    { label: 'Other Deductions', value: '₹ 0' },
    { label: 'Attendance', value: '100%' },
  ],
  grossSalary = '₹ 30,000',
  netSalary = '₹ 27,500',
  payrollHistory = [],
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    if (window.jspdf) return;
    const scriptId = 'jspdf-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleDownload = (dlMonth, dlNetSalary) => {
    if (!window.jspdf) {
      alert("PDF library is still loading. Please try again.");
      return;
    }
    setIsGenerating(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pw = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pw - margin * 2;
      let y = margin;

      const drawLine = (y1) => { doc.setDrawColor(0); doc.setLineWidth(0.5); doc.line(margin, y1, pw - margin, y1); };
      const drawRect = (x, y1, w, h) => { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(x, y1, w, h); };

      // HEADER
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('RESTAURANT ERP PAYSLIP', margin, y); y += 10;
      doc.setFontSize(28); doc.text('Payslip', margin, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Generated from Restaurant ERP payroll records', margin, y); y += 4;
      doc.setLineWidth(1); doc.line(margin, y, pw - margin, y); y += 10;

      // INFO GRID
      const boxW = contentW / 3; const boxH = 22;
      const usedMonth = dlMonth || month;
      const infoData = [
        [{ label: 'Employee Name', value: employeeName }, { label: 'Employee ID', value: employeeId }, { label: 'Month', value: usedMonth }],
        [{ label: 'Department', value: department }, { label: 'Role', value: role }, { label: 'Joining Date', value: joiningDate }],
      ];
      infoData.forEach(row => {
        row.forEach((cell, ci) => {
          const x = margin + ci * boxW;
          drawRect(x, y, boxW, boxH);
          doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
          doc.text(String(cell.label || 'N/A'), x + 4, y + 7);
          doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
          doc.text(String(cell.value || 'N/A'), x + 4, y + 16);
        });
        y += boxH + 4;
      });
      y += 6;

      // SALARY TABLE
      const halfW = contentW / 2;
      drawRect(margin, y, contentW, 10);
      doc.line(margin + halfW, y, margin + halfW, y + 10);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
      doc.text('Earnings', margin + 4, y + 7);
      doc.text('Deductions', margin + halfW + 4, y + 7);
      y += 10;

      const rowCount = Math.max(earnings.length, deductions.length);
      const rowH = 8;
      const tableBodyH = (rowCount + 2) * rowH + 8;
      drawRect(margin, y, halfW, tableBodyH);
      drawRect(margin + halfW, y, halfW, tableBodyH);

      let ey = y + 6;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      earnings.forEach(({ label, value }) => {
        doc.setTextColor(55, 65, 81); doc.text(String(label || ''), margin + 4, ey);
        doc.setFont('helvetica', 'bold'); doc.text(String(value || ''), margin + halfW - 4, ey, { align: 'right' });
        doc.setFont('helvetica', 'normal'); ey += rowH;
      });
      ey += 4;
      doc.line(margin + 4, ey - 5, margin + halfW - 4, ey - 5);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
      doc.text('Gross Salary', margin + 4, ey);
      doc.text(String(grossSalary || ''), margin + halfW - 4, ey, { align: 'right' });

      let dy = y + 6;
      doc.setFont('helvetica', 'normal');
      deductions.forEach(({ label, value }) => {
        doc.setTextColor(55, 65, 81); doc.text(String(label || ''), margin + halfW + 4, dy);
        doc.setFont('helvetica', 'bold'); doc.text(String(value || ''), pw - margin - 4, dy, { align: 'right' });
        doc.setFont('helvetica', 'normal'); dy += rowH;
      });
      y += tableBodyH + 8;

      // NET PAY
      const usedNet = dlNetSalary || netSalary;
      const netH = 28;
      drawRect(margin, y, contentW, netH);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
      doc.text('Net Salary', margin + 6, y + 10);
      doc.setFontSize(22); doc.text(String(usedNet || ''), margin + 6, y + 22);
      doc.setFontSize(10); doc.text('Digital Signature', pw - margin - 6, y + 10, { align: 'right' });
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.text('Verified electronically', pw - margin - 6, y + 16, { align: 'right' });
      y += netH + 8;

      // FOOTER
      drawLine(y); y += 6;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
      doc.text('Generated by Restaurant ERP', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text('Prepared by Owner', margin, y + 5);
      doc.text('Generated Date: ' + new Date().toLocaleDateString(), pw - margin, y, { align: 'right' });

      const filename = `${role.replace(/\s+/g, '_')}_Payslip_${usedMonth.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      setIsGenerating(false);
    } catch (err) {
      console.error('PDF Error:', err);
      setIsGenerating(false);
      alert('Failed to generate PDF: ' + (err.message || JSON.stringify(err)));
    }
  };

  // Inline styles to avoid oklch issues
  const s = {
    page: { backgroundColor: '#ffffff', color: '#111827', width: '100%', maxWidth: '800px', padding: '40px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
    headerSection: { marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' },
    headerLabel: { fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '4px', color: '#111827' },
    headerTitle: { fontSize: '36px', fontWeight: '900', marginBottom: '8px', color: '#000' },
    headerSub: { fontSize: '13px', color: '#374151' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' },
    infoBox: { border: '1px solid #000', padding: '16px' },
    infoLabel: { fontSize: '12px', marginBottom: '4px', color: '#6b7280' },
    infoValue: { fontSize: '18px', fontWeight: 'bold', color: '#000' },
    tableContainer: { border: '1px solid #000', marginBottom: '32px' },
    tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000' },
    thLeft: { padding: '8px', fontWeight: 'bold', borderRight: '1px solid #000' },
    thRight: { padding: '8px', fontWeight: 'bold' },
    tableBody: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
    earningsCol: { padding: '16px', borderRight: '1px solid #000' },
    deductionsCol: { padding: '16px' },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' },
    val: { fontWeight: 'bold' },
    grossRow: { display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #000', fontSize: '13px', fontWeight: 'bold' },
    netBox: { border: '1px solid #000', padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    footer: { borderTop: '1px solid #000', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563' },
  };

  const infoFields = [
    { l: 'Employee Name', v: employeeName }, { l: 'Employee ID', v: employeeId }, { l: 'Month', v: month },
    { l: 'Department', v: department }, { l: 'Role', v: role }, { l: 'Joining Date', v: joiningDate },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>My Payroll</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>View and download your monthly payslips</p>
        </div>
        <button onClick={() => handleDownload()} disabled={isGenerating}
          style={{ backgroundColor: isGenerating ? '#93c5fd' : '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Download size={18} /> {isGenerating ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* Tabs: Current / History */}
      {payrollHistory.length > 0 && (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('current')}
            style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'current' ? '#2563eb' : '#e5e7eb', color: activeTab === 'current' ? '#fff' : '#374151' }}>
            Current Payslip
          </button>
          <button onClick={() => setActiveTab('history')}
            style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'history' ? '#2563eb' : '#e5e7eb', color: activeTab === 'history' ? '#fff' : '#374151' }}>
            Payroll History
          </button>
        </div>
      )}

      {activeTab === 'current' ? (
        /* Current Payslip Preview */
        <div style={s.page}>
          <div style={s.headerSection}>
            <p style={s.headerLabel}>RESTAURANT ERP PAYSLIP</p>
            <h1 style={s.headerTitle}>Payslip</h1>
            <p style={s.headerSub}>Generated from Restaurant ERP payroll records</p>
          </div>
          <div style={s.infoGrid}>
            {infoFields.map((c, i) => (
              <div key={i} style={s.infoBox}><p style={s.infoLabel}>{c.l}</p><p style={s.infoValue}>{c.v}</p></div>
            ))}
          </div>
          <div style={s.tableContainer}>
            <div style={s.tableHeader}><div style={s.thLeft}>Earnings</div><div style={s.thRight}>Deductions</div></div>
            <div style={s.tableBody}>
              <div style={s.earningsCol}>
                {earnings.map((e, i) => (<div key={i} style={s.row}><span>{e.label}</span><span style={s.val}>{e.value}</span></div>))}
                <div style={s.grossRow}><span>Gross Salary</span><span>{grossSalary}</span></div>
              </div>
              <div style={s.deductionsCol}>
                {deductions.map((d, i) => (<div key={i} style={s.row}><span>{d.label}</span><span style={s.val}>{d.value}</span></div>))}
              </div>
            </div>
          </div>
          <div style={s.netBox}>
            <div><p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Net Salary</p><p style={{ fontSize: '30px', fontWeight: '900', color: '#000' }}>{netSalary}</p></div>
            <div style={{ textAlign: 'right' }}><p style={{ fontSize: '13px', fontWeight: 'bold' }}>Digital Signature</p><p style={{ fontSize: '11px', fontStyle: 'italic', marginTop: '8px' }}>Verified electronically</p></div>
          </div>
          <div style={s.footer}>
            <div><p style={{ fontWeight: 'bold' }}>Generated by Restaurant ERP</p><p>Prepared by Owner</p></div>
            <div style={{ textAlign: 'right' }}><p>Generated Date: {new Date().toLocaleDateString()}</p></div>
          </div>
        </div>
      ) : (
        /* Payroll History Table */
        <div style={{ ...s.page, padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Payroll History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '13px' }}>Month</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '13px' }}>Net Salary</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '13px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '13px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{h.month}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 'bold' }}>{h.netSalary}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{h.status}</span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <button onClick={() => handleDownload(h.month, h.netSalary)}
                      style={{ backgroundColor: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeePayroll;

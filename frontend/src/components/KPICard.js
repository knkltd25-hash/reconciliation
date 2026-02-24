import React from 'react';
import PropTypes from 'prop-types';

// Simple placeholder for KPICard
const KPICard = ({ title = 'KPI', value = '-', children }) => (
  <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, margin: 8, minWidth: 120, textAlign: 'center', background: '#f9f9f9' }}>
    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</div>
    <div style={{ fontSize: 24, margin: '8px 0' }}>{value}</div>
    {children}
  </div>
);

KPICard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
};

export default KPICard;

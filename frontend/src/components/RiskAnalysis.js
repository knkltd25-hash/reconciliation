
import React, { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import './RiskAnalysis.css';

const severityColors = {
  High: '#ff4d4f',
  Medium: '#faad14',
  Low: '#52c41a',
};

export default function RiskAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiCall('/api/po-risk-analysis')
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading PO Risk Analysis...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="risk-analysis-container">
      <h2>PO Risk Analysis & Prediction</h2>
      <table className="risk-table">
        <thead>
          <tr>
            <th>PO ID</th>
            <th>Product</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Req. Qty</th>
            <th>Avail. Qty</th>
            <th>Ship Date</th>
            <th>ETA</th>
            <th>Req. Date</th>
            <th>Risk Type</th>
            <th>Risk Reason</th>
            <th>Action</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.po_id}>
              <td>{row.po_id}</td>
              <td>{row.product}</td>
              <td>{row.source}</td>
              <td>{row.dest}</td>
              <td>{row.req_qty}</td>
              <td>{row.avail_qty}</td>
              <td>{row.ship_date}</td>
              <td>{row.eta}</td>
              <td>{row.req_date}</td>
              <td>{row.risk_type}</td>
              <td>{row.risk_reason}</td>
              <td>{row.action}</td>
              <td>
                <span
                  style={{
                    background: severityColors[row.severity] || '#d9d9d9',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}
                >
                  {row.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

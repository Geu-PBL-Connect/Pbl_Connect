import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DepartmentSelector = ({ onSelect }) => {
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState('All');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://3.109.13.119/api/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setSelected(val);
    onSelect(val);
  };

  return (
    <div className="mb-4">
      <label className="text-white text-sm font-semibold mb-2 block">Filter by Department:</label>
      <select 
        value={selected} 
        onChange={handleChange}
        className="p-2 rounded bg-[#2A2A35] text-white border border-[#404050] focus:outline-none focus:border-blue-500"
      >
        <option value="All">All Departments</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
        ))}
      </select>
    </div>
  );
};

export default DepartmentSelector;

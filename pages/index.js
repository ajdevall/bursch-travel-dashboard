import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Lock, LogOut } from 'lucide-react';

const BurschDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({
    vendor: 'all',
    location: 'all',
    mediaType: 'all',
    year: 'all',
    month: 'all'
  });

  const [formData, setFormData] = useState({
    vendor: '',
    location: '',
    month: '',
    year: '2026',
    mediaType: 'Radio',
    amount: ''
  });

  const ADMIN_PASSWORD = 'bursch2026';

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Load entries from database
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (entry) => {
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', entry })
      });
      const data = await response.json();
      if (data.success) {
        await fetchEntries();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    }
  };

  const deleteEntry = async (id) => {
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await response.json();
      if (data.success) {
        await fetchEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const uniqueVendors = [...new Set(entries.map(e => e.vendor))];
  const uniqueLocations = [...new Set(entries.map(e => e.location))];
  const uniqueYears = [...new Set(entries.map(e => e.year))];

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filters.vendor !== 'all' && entry.vendor !== filters.vendor) return false;
      if (filters.location !== 'all' && entry.location !== filters.location) return false;
      if (filters.mediaType !== 'all' && entry.mediaType !== filters.mediaType) return false;
      if (filters.year !== 'all' && entry.year !== filters.year) return false;
      if (filters.month !== 'all' && entry.month !== filters.month) return false;
      return true;
    });
  }, [entries, filters]);

  const totalSpending = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

  const monthlyData = useMemo(() => {
    const data = { Radio: {}, Digital: {} };
    
    filteredEntries.forEach(entry => {
      const key = `${entry.month} ${entry.year}`;
      if (!data[entry.mediaType][key]) {
        data[entry.mediaType][key] = 0;
      }
      data[entry.mediaType][key] += parseFloat(entry.amount);
    });

    return data;
  }, [filteredEntries]);

  const monthColumns = useMemo(() => {
    const cols = new Set();
    filteredEntries.forEach(entry => {
      cols.add(`${entry.month} ${entry.year}`);
    });
    return Array.from(cols).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
  }, [filteredEntries]);

  const handleLogin = () => {
    if (loginPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setLoginPassword('');
    } else {
      alert('Incorrect password');
      setLoginPassword('');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleSubmit = async () => {
    if (!formData.vendor || !formData.location || !formData.month || !formData.year || !formData.amount) {
      alert('Please fill in all fields');
      return;
    }
    
    const entry = editingEntry 
      ? { ...formData, id: editingEntry.id }
      : { ...formData, id: Date.now().toString() };
    
    await saveEntry(entry);
    
    setEditingEntry(null);
    setFormData({
      vendor: '',
      location: '',
      month: '',
      year: '2026',
      mediaType: 'Radio',
      amount: ''
    });
    setShowForm(false);
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bursch-travel-data.json';
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock className="text-indigo-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bursch Travel</h1>
            <p className="text-gray-600">Media Spending Dashboard</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Login
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Viewing access only. Login required to add or edit data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bursch Travel</h1>
              <p className="text-gray-600">Media Spending Dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportJSON}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <Download size={20} />
                Export Data
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={20} />
                Add Entry
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Total Spending</h2>
          <div className="text-4xl font-bold text-indigo-600">
            ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Royal Caribbean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Alexandria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Radio">Radio</option>
                  <option value="Digital">Digital</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
                    setFormData({
                      vendor: '',
                      location: '',
                      month: '',
                      year: '2026',
                      mediaType: 'Radio',
                      amount: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <select
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Vendors</option>
                {uniqueVendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
              <select
                value={filters.mediaType}
                onChange={(e) => setFilters({ ...filters, mediaType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Media</option>
                <option value="Radio">Radio</option>
                <option value="Digital">Digital</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Breakdown</h2>
          {monthColumns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-semibold text-gray-700">Media Type</th>
                    {monthColumns.map(month => (
                      <th key={month} className="text-right p-3 font-semibold text-gray-700">{month}</th>
                    ))}
                    <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">Radio</td>
                    {monthColumns.map(month => (
                      <td key={month} className="text-right p-3 text-gray-700">
                        ${(monthlyData.Radio[month] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td className="text-right p-3 font-semibold text-gray-800">
                      ${Object.values(monthlyData.Radio).reduce((sum, val) => sum + val, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">Digital</td>
                    {monthColumns.map(month => (
                      <td key={month} className="text-right p-3 text-gray-700">
                        ${(monthlyData.Digital[month] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td className="text-right p-3 font-semibold text-gray-800">
                      ${Object.values(monthlyData.Digital).reduce((sum, val) => sum + val, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50 font-semibold">
                    <td className="p-3 text-gray-800">Total</td>
                    {monthColumns.map(month => {
                      const total = (monthlyData.Radio[month] || 0) + (monthlyData.Digital[month] || 0);
                      return (
                        <td key={month} className="text-right p-3 text-gray-800">
                          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                    <td className="text-right p-3 text-gray-800">
                      ${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data to display. Add entries to see the breakdown.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Entries</h2>
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-3 font-semibold text-gray-700">Vendor</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Location</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Month</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Year</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Media Type</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Amount</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-gray-700">{entry.vendor}</td>
                      <td className="p-3 text-gray-700">{entry.location}</td>
                      <td className="p-3 text-gray-700">{entry.month}</td>
                      <td className="p-3 text-gray-700">{entry.year}</td>
                      <td className="p-3 text-gray-700">{entry.mediaType}</td>
                      <td className="text-right p-3 text-gray-700">
                        ${parseFloat(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-800 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No entries found. Add your first entry to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BurschDashboard;

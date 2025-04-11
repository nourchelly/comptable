import React, { useState } from 'react';
const CreateAudit = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'interne',
    startDate: '',
    endDate: '',
    team: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Audit "${formData.title}" planifié !`);
    // Envoi API ici...
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Nouvel Audit</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Titre</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Type</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="interne">Interne</option>
            <option value="externe">Externe (Client)</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Planifier
        </button>
      </form>
    </div>
  );
};

export default CreateAudit;
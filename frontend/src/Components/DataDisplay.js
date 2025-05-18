import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes

const DataDisplay = ({ data, title, anomalies, type }) => {
  if (!data) {
    return <div>Aucune donnée à afficher.</div>;
  }

  const getAnomalyStyle = (key) => {
    if (anomalies && anomalies.some(anomaly => anomaly.champ === key)) {
      return 'bg-red-100';
    }
    return '';
  };

  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Champ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valeur
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${getAnomalyStyle(key)}`}>
                  {key}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* Gérez l'affichage des objets et tableaux de manière appropriée */}
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Ajout de la validation des props avec PropTypes
DataDisplay.propTypes = {
  data: PropTypes.object,
  title: PropTypes.string,
  anomalies: PropTypes.arrayOf(PropTypes.object), // Tableau d'objets
  type: PropTypes.string,
};

export default DataDisplay;
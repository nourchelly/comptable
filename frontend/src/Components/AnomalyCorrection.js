import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle } from 'react-icons/fa';

const AnomalyCorrection = React.memo(({ anomaly, index, corrections, onCorrectionChange }) => {
  const safeAnomaly = anomaly || {};

  // Utiliser useCallback pour éviter la recréation inutile de la fonction
  const handleChange = useCallback((event) => {
    onCorrectionChange(index, {
      anomalyId: safeAnomaly.id || `temp-${index}`,
      type: safeAnomaly.type || 'inconnu',
      field: safeAnomaly.field || 'champ_inconnu',
      value: event.target.value,
      originalValue: safeAnomaly.originalValue,
      expectedValue: safeAnomaly.expectedValue,
      message: safeAnomaly.message
    });
  }, [index, onCorrectionChange, safeAnomaly]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-start">
        <FaExclamationTriangle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-gray-800">{safeAnomaly.message || 'Anomalie non spécifiée'}</p>
          <p className="text-sm text-gray-500 mt-1">
            {safeAnomaly.type ? `${safeAnomaly.type === 'facture' ? 'Facture' : 'Relevé bancaire'}` : 'Type inconnu'} -
            {safeAnomaly.field ? ` Champ: ${safeAnomaly.field}` : ' Champ inconnu'}
          </p>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correction proposée:
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={corrections[index]?.value || ''}
              onChange={handleChange}
              placeholder={
                safeAnomaly.expectedValue
                  ? `Valeur attendue: ${safeAnomaly.expectedValue}`
                  : "Entrez votre correction"
              }
            />
            {safeAnomaly.originalValue && (
              <p className="text-xs text-gray-500 mt-1">
                Valeur actuelle: {safeAnomaly.originalValue}
              </p>
            )}
            {safeAnomaly.expectedValue && (
              <p className="text-xs text-gray-500 mt-1">
                Valeur attendue: {safeAnomaly.expectedValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

AnomalyCorrection.propTypes = {
  anomaly: PropTypes.object,
  index: PropTypes.number.isRequired,
  corrections: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCorrectionChange: PropTypes.func.isRequired,
};

export default AnomalyCorrection;
// AnomalyCorrection.js (MISE À JOUR)

import React, { useCallback, useState, useEffect } from 'react'; // Ajout de useState et useEffect
import PropTypes from 'prop-types';
import { FaExclamationTriangle } from 'react-icons/fa'; // Assurez-vous d'avoir cette icône installée

const AnomalyCorrection = React.memo(({ anomaly, index, onCorrectionChange }) => {
  // 'anomaly' est l'objet structuré que nous avons créé dans ReconciliationEditModal
  // Il contient: { id, message, type, field, originalValue, expectedValue, userCorrection }

  // Utilisez l'état local pour contrôler la valeur de l'input
  const [correctionText, setCorrectionText] = useState(anomaly.userCorrection || '');

  // Mettre à jour l'état local si l'anomalie change (par exemple si le rapport parent est mis à jour)
  useEffect(() => {
    setCorrectionText(anomaly.userCorrection || '');
  }, [anomaly.userCorrection]); // Dépendance sur userCorrection de l'objet anomaly

  // Utiliser useCallback pour éviter la recréation inutile de la fonction
  const handleChange = useCallback((event) => {
    const newText = event.target.value;
    setCorrectionText(newText); // Met à jour l'état local de l'input

    // Notifie le composant parent (ReconciliationEditModal) du changement
    // onCorrectionChange(index, { userCorrection: newText }); // Ancien
    onCorrectionChange(index, newText); // Nouveau: on envoie juste la valeur texte
  }, [index, onCorrectionChange]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-start">
        {/* L'icône que vous avez déjà */}
        <FaExclamationTriangle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
        <div className="flex-1">
          {/* Affiche le message d'anomalie principal */}
          <p className="font-medium text-gray-800">{anomaly.message || 'Anomalie non spécifiée'}</p>
          
          {/* Affiche les détails supplémentaires (type, champ) s'ils sont pertinents pour l'utilisateur */}
          {/* Note: Ces valeurs sont des valeurs par défaut du frontend car le backend envoie juste une chaîne */}
          <p className="text-sm text-gray-500 mt-1">
            {anomaly.type ? `${anomaly.type}` : 'Type inconnu'} -
            {anomaly.field ? ` Champ: ${anomaly.field}` : ' Champ inconnu'}
          </p>

          <div className="mt-3">
            <label htmlFor={`correction-input-${anomaly.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Correction / Commentaire:
            </label>
            <input
              type="text"
              id={`correction-input-${anomaly.id}`} // ID unique pour chaque input
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={correctionText} // Lié à l'état local 'correctionText'
              onChange={handleChange}
              placeholder={
                anomaly.originalValue && anomaly.originalValue !== 'N/A' // Si une valeur originale est disponible
                  ? `Anomalie: "${anomaly.originalValue}". Entrez votre correction...`
                  : "Entrez votre correction ou commentaire ici..."
              }
            />
            {anomaly.originalValue && anomaly.originalValue !== 'N/A' && (
              <p className="text-xs text-gray-500 mt-1">
                Valeur détectée (si applicable): {anomaly.originalValue}
              </p>
            )}
            {anomaly.expectedValue && anomaly.expectedValue !== 'N/A' && (
              <p className="text-xs text-gray-500 mt-1">
                Valeur attendue (si applicable): {anomaly.expectedValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// AnomalyCorrection.propTypes (vous pouvez les garder si vous voulez les validations de props)
AnomalyCorrection.propTypes = {
  anomaly: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.string,
    field: PropTypes.string,
    originalValue: PropTypes.string,
    expectedValue: PropTypes.string,
    userCorrection: PropTypes.string, // La nouvelle prop que nous gérons
  }).isRequired,
  index: PropTypes.number.isRequired,
  // 'corrections' n'est plus nécessaire ici car on gère l'état via 'anomaly.userCorrection'
  // corrections: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCorrectionChange: PropTypes.func.isRequired,
};

export default AnomalyCorrection;
import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSave, FaSpinner } from 'react-icons/fa';
import PropTypes from 'prop-types'; // Import PropTypes

const ReconciliationEditModal = ({ reconciliation, onSave, onCancel, loading }) => {
  const [corrections, setCorrections] = useState('');
  const [comments, setComments] = useState('');

  // Utiliser useCallback pour éviter la recréation inutile de la fonction
  const updateState = useCallback(() => {
    if (reconciliation) {
      setCorrections(reconciliation?.report?.rapprochement?.corrections || '');
      setComments(reconciliation?.report?.metadata?.commentaires || '');
    }
  }, [reconciliation]);

  useEffect(() => {
    updateState();
  }, [updateState]);

  // Utiliser useCallback pour éviter la recréation inutile de la fonction
  const handleSave = useCallback(() => {
    onSave({ corrections, comments }); // Modifier pour envoyer un objet
  }, [onSave, corrections, comments]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="modal-content bg-white w-4/5 md:w-1/2 lg:w-1/3 mx-auto my-24 p-6 rounded-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Éditer le Rapprochement</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="corrections" className="block text-sm font-medium text-gray-700">
            Corrections
          </label>
          <textarea
            id="corrections"
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
            Commentaires
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-800">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Sauvegarder...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Ajout de la validation des props avec PropTypes
ReconciliationEditModal.propTypes = {
  reconciliation: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default ReconciliationEditModal;
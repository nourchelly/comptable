// src/services/rapportService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Service pour les opérations liées aux rapports de rapprochement
 */
const rapportService = {
  /**
   * Récupère la liste des rapports avec filtres optionnels
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise} Promise contenant les données
   */
  getRapports: async (filters = {}) => {
    try {
      // Construction des paramètres de requête
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.facture_id) params.append('facture_id', filters.facture_id);
      if (filters.banque_id) params.append('banque_id', filters.banque_id);
      
      const url = `${API_URL}/api/rapports${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports', error);
      throw error;
    }
  },

  /**
   * Récupère un rapport spécifique par son ID
   * @param {string} rapportId - ID du rapport à récupérer
   * @returns {Promise} Promise contenant les données
   */
  getRapportById: async (rapportId) => {
    try {
      const response = await axios.get(`${API_URL}/api/rapport/${rapportId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du rapport ${rapportId}`, error);
      throw error;
    }
  },

  /**
   * Génère un rapport PDF pour un rapport spécifique
   * @param {string} rapportId - ID du rapport à générer en PDF
   * @returns {Promise} Promise contenant l'URL du PDF généré
   */
  generatePDF: async (rapportId) => {
    try {
      const response = await axios.get(`${API_URL}/api/rapport/${rapportId}/pdf`, {
        responseType: 'blob'
      });
      
      // Création d'une URL de blob pour télécharger le PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Création d'un élément invisible pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${rapportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return url;
    } catch (error) {
      console.error(`Erreur lors de la génération du PDF pour le rapport ${rapportId}`, error);
      throw error;
    }
  },
  
  /**
   * Recherche des rapports avec une requête textuelle
   * @param {string} query - Texte recherché
   * @returns {Promise} Promise contenant les données
   */
  searchRapports: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/api/rapports/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de rapports', error);
      throw error;
    }
  }
};

export default rapportService;
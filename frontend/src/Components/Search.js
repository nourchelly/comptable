import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { Link } from "react-router-dom";
const SearchComponent = () => {
  const [searchError, setSearchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fonction de recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
  
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/search/", {
        params: { q: query.trim(), limit: 10 },
        withCredentials: true,
        timeout: 3000
      });
  
      console.log("API Response:", response.data); // 👈 Ajoutez ce log
  
      if (response.data?.results) {
        setSearchResults(response.data.results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        console.error('Structure inattendue:', response.data);
      }
    } catch (err) {
      console.error("Erreur de recherche:", err);
      setSearchError(err.message || "Erreur lors de la recherche");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher utilisateurs, documents..."
          className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length > 0 && setShowResults(true)}
        />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        )}
        
        {isSearching && (
          <FaSpinner className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && (
  <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto">
    {searchError ? (
      <div className="p-4 text-center text-red-500">{searchError}</div>
    ) : searchResults.length > 0 ? (
      <div>
        {/* Affichez les données brutes pour débogage */}
        <pre className="p-4 text-xs">
          {JSON.stringify(searchResults, null, 2)}
        </pre>
        
        {/* Version normale (à remettre après test) */}
        {searchResults.map((result) => (
          <Link
            key={result.id}
            to={result.link}
            className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="font-medium text-gray-800">{result.name}</div>
            <div className="text-xs text-gray-500 mt-1 capitalize">
              {result.type}
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <div className="p-4 text-center text-gray-500">
        Aucun résultat trouvé
      </div>
    )}
  </div>
)}
    </div>
  );
};

export default SearchComponent;
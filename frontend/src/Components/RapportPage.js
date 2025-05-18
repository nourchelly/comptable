import React, { useState } from 'react';
import RapportsList from './RapportsList';
import RapportDetail from './RapportDetail';

const RapportsPage = () => {
  const [selectedRapportId, setSelectedRapportId] = useState(null);

  return (
    <div>
      {selectedRapportId ? (
        <RapportDetail
          rapportId={selectedRapportId}
          onBack={() => setSelectedRapportId(null)}
        />
      ) : (
        <RapportsList onSelectRapport={setSelectedRapportId} />
      )}
    </div>
  );
};

export default RapportsPage;
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const Calendar = () => {
  const [events, setEvents] = useState([
    { title: 'Audit Client X', date: '2025-05-10' },
    { title: 'Audit Interne', date: '2025-05-15' }
  ]);

  const handleDateClick = (arg) => {
    const title = prompt("Nom de l'audit :");
    if (title) {
      setEvents([...events, { title, date: arg.dateStr }]);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        editable={true}
        locale="fr"
      />
    </div>
  );
};

export default Calendar;
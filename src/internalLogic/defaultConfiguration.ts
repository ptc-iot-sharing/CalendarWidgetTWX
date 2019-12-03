import { OptionsInput } from '@fullcalendar/core';

export let BaseCalendarConfiguration: OptionsInput = {
    header: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,dayGridWeek'
    },
    defaultDate: new Date,
    navLinks: true,
    editable: false,
    eventLimit: true,
    defaultView: 'agendaWeek',
    height: 'parent',
    nowIndicator: true,
    weekNumbers: true,
    weekNumbersWithinDays: true,
    snapDuration: '00:01:00'
};
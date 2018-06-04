import 'fullcalendar'
import { OptionsInput } from 'fullcalendar/src/types/input-types';

export let BaseCalendarConfiguration: OptionsInput = {
    header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay,listWeek'
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
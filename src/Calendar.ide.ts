// automatically import the css file
import { ThingworxComposerWidget } from './support/widgetRuntimeSupport'
import 'fullcalendar'
import Calendar from 'fullcalendar/Calendar'
import { BaseCalendarConfiguration } from './internalLogic/defaultConfiguration';
import { OptionsInput } from 'fullcalendar';

@ThingworxComposerWidget
class CalendarWidget extends TWComposerWidget {

    calendar: Calendar;

    widgetIconUrl(): string {
        return require('./images/icon.png');
    }

    widgetProperties(): TWWidgetProperties {
        require("./styles/common.css");
        require('../node_modules/fullcalendar/dist/fullcalendar.css')
        return {
            name: 'Calendar',
            description: 'A calendar.',
            category: ['Common'],
            supportsAutoResize: true,
            properties: {
                Width: {
                    description: 'Total width of the widget.',
                    baseType: 'NUMBER',
                    isVisible: true,
                    defaultValue: 600,
                    isBindingTarget: false
                },
                Height: {
                    description: 'Total height of the widget.',
                    baseType: 'NUMBER',
                    isVisible: true,
                    defaultValue: 400,
                    isBindingTarget: false
                },
                Data: {
                    description: 'The calendar\'s data source.',
                    baseType: 'INFOTABLE',
                    isBindingSource: true,
                    isBindingTarget: true
                },
                VisibleData: {
                    description: 'A subset of the data infotable containing only the currently visible event items.',
                    baseType: 'INFOTABLE',
                    isBindingSource: true
                },
                EventNameField: {
                    description: 'The field representing event names.',
                    baseType: 'FIELDNAME',
                    sourcePropertyName: 'Data'
                },
                EventStartDateField: {
                    description: 'The field representing event start dates.',
                    baseType: 'FIELDNAME',
                    sourcePropertyName: 'Data',
                    baseTypeRestriction: 'DATETIME'
                },
                EventEndDateField: {
                    description: 'The field representing event end dates. If the value of this field is undefined the corresponding event is considered to be an all-day event.',
                    baseType: 'FIELDNAME',
                    sourcePropertyName: 'Data',
                    baseTypeRestriction: 'DATETIME'
                },
                EventIDField: {
                    description: 'Optional. The field representing event identifiers. If two events have the same identifier they are considered to be two instances of the same repeating event.',
                    baseType: 'FIELDNAME',
                    sourcePropertyName: 'Data',
                    baseTypeRestriction: 'NUMBER'
                },
                Editable: {
                    description: 'Controls whether this calendar can be modified at runtime.',
                    baseType: 'BOOLEAN',
                    defaultValue: false,
                    isBindingTarget: true
                },
                EventStates: {
                    description: 'Controls the event styles.',
                    baseType: 'STATEFORMATTING',
                    baseTypeInfotableProperty: 'Data'
                },
                DragInterval: {
                    description: 'Controls how large the minimum drag interval is. The format of this property is a moment string.',
                    baseType: 'STRING',
                    defaultValue: '00:01:00'
                },
                Locale: {
                    description: 'Optional. Defaults to en. The locale to use.',
                    defaultValue: 'en',
                    baseType: 'STRING',
                    isBindingTarget: true
                },
                Views: {
                    description: 'Controls the available views.',
                    defaultValue: 'month,agendaWeek,agendaDay,listWeek',
                    baseType: 'STRING',
                    selectOptions: [
                        {text: 'Select', value: 'month,agendaWeek,agendaDay,listWeek'},
                        {text: 'Month', value: 'month'},
                        {text: 'Week', value: 'agendaWeek'},
                        {text: 'Day', value: 'agendaDay'},
                        {text: 'List', value: 'listWeek'},
                    ]
                }
            }
        };
    };

    widgetServices(): Dictionary<TWWidgetService> {
        return {
            "TestService": {
                
            }
        };
    };

    widgetEvents(): Dictionary<TWWidgetEvent> {
        return {
            CalendarDidModifyEvents: {}
        };
    }

    renderHtml(): string {
        return '<div class="widget-content CalendarWidget"></div>';
    };

    afterRender(): void {
        this.jqElement.parent().addClass('CalendarBoundingBox');

        let IDEConfiguration: OptionsInput = {
            events: [
                {
                  title: 'All Day Event',
                  start: new Date,
                },
                {
                  title: 'Long Event',
                  start: new Date,
                  end: (() => {let d = new Date; d.setDate(d.getDate() + 7); return d;})()
                },
                {
                  id: 999,
                  title: 'Repeating Event',
                  start: new Date
                },
                {
                  id: 999,
                  title: 'Repeating Event',
                  end: (() => {let d = new Date; d.setDate(d.getDate() + 1); return d;})()
                },
                {
                  title: 'Conference',
                  start: new Date,
                  end: (() => {let d = new Date; d.setDate(d.getDate() + 2); return d;})()
                },
                {
                  title: 'Meeting',
                  start: (() => {let d = new Date; d.setHours(d.getHours() - 5); return d;})(),
                  end: (() => {let d = new Date; d.setHours(d.getHours() - 2); return d;})()
                },
                {
                  title: 'Lunch',
                  start: (() => {let d = new Date; d.setHours(12); return d;})()
                },
                {
                  title: 'Meeting',
                  start: (() => {let d = new Date; d.setHours(18); return d;})()
                },
                {
                  title: 'Happy Hour',
                  start: (() => {let d = new Date; d.setHours(20); return d;})()
                },
                {
                  title: 'Dinner',
                  start: (() => {let d = new Date; d.setHours(22); return d;})()
                },
                {
                  title: 'Birthday Party',
                  start: (() => {let d = new Date; d.setHours(d.getHours() + 48); return d;})(),
                  end: (() => {let d = new Date; d.setHours(d.getHours() + 72); return d;})()
                }
              ]
        };

        let calendar = this.jqElement.fullCalendar($.extend({}, BaseCalendarConfiguration, IDEConfiguration));

        this.calendar = this.jqElement.fullCalendar('getCalendar');
    }

    resize() {
        this.calendar.render();
    }

    beforeDestroy(): void {
        this.calendar.destroy();
    }

    getSourceDatashapeName(propertyName: string): any {
        if (propertyName == 'Data') {
            return (this as any).getInfotableMetadataForProperty(propertyName);
        }
    }

}
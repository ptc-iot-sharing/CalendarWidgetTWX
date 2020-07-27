// automatically import the css file
import { ThingworxComposerWidget } from 'typescriptwebpacksupport/widgetidesupport'
import { Calendar, OptionsInput } from '@fullcalendar/core'
import { BaseCalendarConfiguration } from './internalLogic/defaultConfiguration';

@ThingworxComposerWidget
class CalendarWidget extends TWComposerWidget {

    calendar: Calendar;

    widgetIconUrl(): string {
        return require('./images/icon.png').default;
    }

    widgetProperties(): TWWidgetProperties {
        require("./styles/common.css");
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
                EventDescriptionField: {
                    description: 'If specified, this represents the event description which appears below the name.',
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
                    defaultValue: 'dayGridMonth,timeGridWeek,timeGridDay,dayGridWeek',
                    baseType: 'STRING',
                    selectOptions: [
                        {text: 'Select', value: 'dayGridMonth,timeGridWeek,timeGridDay,dayGridWeek'},
                        {text: 'Month', value: 'dayGridMonth'},
                        {text: 'Week', value: 'timeGridWeek'},
                        {text: 'Day', value: 'timeGridDay'},
                        {text: 'List', value: 'dayGridWeek'},
                    ]
                },
                ShowHeader: {
                    description: 'If enabled, the header will be displayed.',
                    defaultValue: true,
                    baseType: 'BOOLEAN'
                },
                WeekSlotDuration: {
                    description: 'Controls how much time each week view row should take.',
                    baseType: 'STRING',
                    defaultValue: '00:30:00'
                },
                ShowAllDaySlot: {
                    description: 'Controls whether the all day slot will be visible.',
                    baseType: 'BOOLEAN',
                    defaultValue: true
                },
                ViewStartDate: {
                    description: 'Represents the start date that is currently visible on screen. For month view, this will represent the first day of the month.',
                    baseType: 'DATETIME',
                    isEditable: false,
                    isBindingSource: true
                },
                ViewEndDate: {
                    description: 'Represents the end date that is currently visible on screen. For month view, this will represent the last day of the month.',
                    baseType: 'DATETIME',
                    isEditable: false,
                    isBindingSource: true
                },
                DragToSelect: {
                    description: 'When enabled, the user can drag on dates to select them.',
                    baseType: 'BOOLEAN',
                    defaultValue: false
                },
                DragToCreateEvent: {
                    description: 'When enabled together with "DragToSelect", creating a selection will create an event in that slot.',
                    baseType: 'BOOLEAN',
                    defaultValue: false
                },
                ClickToSelect: {
                    description: 'When enabled, the user can click an interval to select it. The first click will select the starting date and the second one will select the end date.',
                    baseType: 'BOOLEAN',
                    defaultValue: false
                },
                DoubleClickToCreateEvent: {
                    description: 'When enabled, double clicking an empty slot will create an event.',
                    baseType: 'BOOLEAN',
                    defaultValue: false,
                    isVisible: false
                },
                NewEventName: {
                    description: 'When a new event is created, this represents the default name that is assigned to that event.',
                    baseType: 'STRING',
                    defaultValue: 'New Event'
                },
                NewEventProperties: {
                    description: 'If specified, when a new event is created, this represents additional properties to assign to that event. This is a JSON object.',
                    baseType: 'STRING',
                    defaultValue: '{}',
                    isBindingSource: true
                },
                ClickedDate: {
                    description: 'When the user clicks on a date, this represents the clicked date.',
                    baseType: 'DATETIME',
                    isEditable: false,
                    isBindingSource: true
                },
                SelectionStart: {
                    description: 'When selection is enabled, this represents the start of the selected interval.',
                    baseType: 'DATETIME',
                    isEditable: false,
                    isBindingSource: true,
                    isBindingTarget: true
                },
                SelectionEnd: {
                    description: 'When selection is enabled, this represents the end of the selected interval.',
                    baseType: 'DATETIME',
                    isEditable: false,
                    isBindingSource: true,
                    isBindingTarget: true
                },
                MiniCalendar: {
                    description: 'If enabled, the calendar will become a mini calendar when it is shrinked beyond a certain size.',
                    defaultValue: false,
                    baseType: 'BOOLEAN'
                }
            }
        };
    };

    widgetServices(): Dictionary<TWWidgetService> {
        return {
            ClearSelection: {description: 'Can be invoked to clear the current selection.'}
        };
    };

    widgetEvents(): Dictionary<TWWidgetEvent> {
        return {
            CalendarDidModifyEvents: {description: 'Triggered whenever an event is moved or resized.'},
            ViewDidChange: {description: 'Triggered whenever the view changes.'},
            UserDidClickDate: {description: 'Triggered whenever the user clicks on a date. The ClickedDate property will hold the clicked date value.'},
            SelectionDidChange: {description: 'Triggered whenever the selection changes.'},
            CalendarDidCreateEvent: {description: 'Triggered whenever the calendar creates an event. This is triggered after the event is created but before it has been rendered.'}
        };
    }

    renderHtml(): string {
        return '<div class="widget-content CalendarWidget"></div>';
    };

    afterRender(): void {

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

        const versionComponents: number[] = TW.version.split('.').map(n => parseInt(n));

        // TBD
        if (versionComponents[0] < 8 || (versionComponents[0] == 8 && versionComponents[1] < 4)) {
            this.jqElement[0].innerText = 'Preview is currently unavailable.'
        }
        else {
            this.jqElement[0].innerText = 'Preview is currently unavailable.'
        }
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
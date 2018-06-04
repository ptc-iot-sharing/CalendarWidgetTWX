import { ThingworxRuntimeWidget, TWService, TWProperty } from './support/widgetRuntimeSupport'
import 'fullcalendar'
import '../node_modules/fullcalendar/dist/locale-all'
import Calendar from 'fullcalendar/Calendar'
import { OptionsInput, EventObjectInput } from 'fullcalendar';
import { BaseCalendarConfiguration } from './internalLogic/defaultConfiguration';
import { Moment, Duration } from 'moment';

@ThingworxRuntimeWidget
class CalendarWidget extends TWRuntimeWidget {

    /**
     * The full calendar instance managed by this widget.
     */
    calendar: Calendar;

    readonly eventClass: string = 'CalendarEvent';

    @TWProperty('Editable')
    set editable(editable: any) {
        let editableBool = eval(editable);

        this.calendar.option('editable', editableBool);
        this.calendar.option('eventDurationEditable', editableBool);
        this.calendar.option('eventStartEditable', editableBool);
    }

    @TWProperty('EventNameField')
    nameField: string;

    @TWProperty('EventStartDateField')
    startDateField: string;

    @TWProperty('EventEndDateField')
    endDateField: string;

    @TWProperty('EventIDField')
    IDField: number;

    @TWProperty('Views')
    view: string;

    private _visibleData: TWInfotable;

    @TWProperty('VisibleData')
    visibleData: TWInfotable;

    @TWProperty('Data')
    set data(data: TWInfotable) {
        this._visibleData = {
            dataShape: {fieldDefinitions: {}},
            rows: []
        };

        if (data) {
            this._visibleData.dataShape.fieldDefinitions = JSON.parse(JSON.stringify(data.dataShape.fieldDefinitions));
        }

        this.calendar.refetchEvents();
    }

    @TWProperty('EventStates')
    states: any;

    @TWProperty('DragInterval')
    dragInterval: string;

    @TWProperty('Locale')
    set locale(locale: string) {
        if (this.calendar) {
            this.calendar.option('locale', locale);
        }
    }

    selectedIndices: number[] = [];

    serviceInvoked(name: string): void {
        throw new Error("Method not implemented.");
    }

    renderHtml(): string {
        require("./styles/common.css");
        require('../node_modules/fullcalendar/dist/fullcalendar.css')
        return '<div class="widget-content CalendarWidget"></div>';
    }

    events: ((start: Moment, end: Moment, timezone: any, callback: (events: EventObjectInput[]) => void) => void) = (start, end, timezone, callback) => {
        if (!this.data) return;

        let startTimestamp = +start;
        let endTimestamp = +end;

        let events: EventObjectInput[] = [];

        this._visibleData.rows = [];

        for (let i = 0; i < this.data.rows.length; i++) {
            let row = this.data.rows[i];
            if (this.endDateField) {
                if (!row[this.endDateField]) {
                    // If this row doesn't have an end date, consider it an all day event
                    if (+row[this.startDateField] >= startTimestamp && +row[this.startDateField] <= endTimestamp) {
                        this._visibleData.rows.push(row);
                        events.push({
                            title: row[this.nameField],
                            id: this.IDField ? row[this.IDField] : undefined,
                            start: row[this.startDateField],
                            dataIndex: i,
                            className: this.eventClass,
                            allDay: true
                        })
                    }
                }
                else {
                    // Otherwise check to see if it intersects the full calendar given range
                    let intervalRange = {start: startTimestamp, end: endTimestamp};
                    let eventRange = {start: +row[this.startDateField], end: +row[this.endDateField]};

                    let minRange = (intervalRange.start < eventRange.start ? intervalRange : eventRange);
                    let maxRange = (minRange == intervalRange ? eventRange : intervalRange);

                    if (minRange.end >= maxRange.start) {
                        this._visibleData.rows.push(row);
                        events.push({
                            title: row[this.nameField],
                            id: this.IDField ? row[this.IDField] : undefined,
                            start: row[this.startDateField],
                            end: row[this.endDateField],
                            dataIndex: i,
                            className: this.eventClass
                        })
                    }
                }
            }
            else {
                if (+row[this.startDateField] >= startTimestamp && +row[this.startDateField] <= endTimestamp) {
                    this._visibleData.rows.push(row);
                    events.push({
                        title: row[this.nameField],
                        id: this.IDField ? row[this.IDField] : undefined,
                        start: row[this.startDateField],
                        dataIndex: i,
                        className: this.eventClass,
                        allDay: true
                    })
                }
            }
        }

        this.visibleData = this._visibleData;
        callback(events);
    };

    async afterRender(): Promise<void> {
        this.boundingBox.addClass('CalendarBoundingBox');
        
        let runtimeConfiguration: OptionsInput = {
            header: {
                left: 'prev,next today',
                center: 'title',
                right: this.view.indexOf(',') == -1 ? '' : this.view
            },
            editable: this.getProperty('Editable', false),
            eventDurationEditable: this.getProperty('Editable', false),
            eventStartEditable: this.getProperty('Editable', false),
            events: this.events,
            snapDuration: this.dragInterval || '00:01:00',
            defaultView: this.view.indexOf(',') == -1 ? this.view : 'agendaWeek',
            locale: this.locale,
            eventClick: (calendarEvent: EventObjectInput, event: MouseEvent, view: any) => {
                if (event.ctrlKey || event.metaKey) {
                    let index = this.selectedIndices.indexOf(calendarEvent.dataIndex);

                    if (index != -1) {
                        this.selectedIndices.splice(index, 1);
                        this.updateSelection('Data', this.selectedIndices);
                        this.calendar.refetchEvents();
                    }
                    else {
                        this.selectedIndices.push(calendarEvent.dataIndex);
                        this.updateSelection('Data', this.selectedIndices);
                        this.calendar.refetchEvents();
                    }
                }
                else {
                    // Select the event
                    this.updateSelection('Data', [calendarEvent.dataIndex]);
                    this.selectedIndices = [calendarEvent.dataIndex];
                    this.calendar.refetchEvents();
                }
            },
            eventRender: (event: EventObjectInput, element: JQuery<HTMLElement>, view: any) => {
                // Apply the per-event state formatting
                if (!this.states) return;

                let dataRow = this.data.rows[event.dataIndex];
                let isSelected = this.selectedIndices.indexOf(event.dataIndex) != -1;

                let stateFormat = TW.getStyleFromStateFormatting({ DataRow: dataRow, StateFormatting: this.states });
                
                if (!stateFormat) return;

                let attributes = '';

                // Set the line color
                if (stateFormat.lineColor) {
                    attributes += `border-left-color: ${stateFormat.lineColor} !important; `;
                }
                else {
                    attributes += `border-left-color: transparent !important; `;
                }

                // Background color
                if (stateFormat.backgroundColor) {
                    attributes += `background-color: ${isSelected ? stateFormat.lineColor || stateFormat.backgroundColor : stateFormat.backgroundColor} !important; `;
                }
                else {
                    attributes += `background-color: transparent !important; `;
                }

                // And foreground color
                if (stateFormat.foregroundColor) {
                    attributes += `color: ${isSelected ? 'white' : stateFormat.foregroundColor} !important; `;
                }
                else {
                    attributes += `color: transparent !important; `;
                }

                element[0].setAttribute('style', (element[0].getAttribute('style') || '') + attributes);
            },
            eventDrop: (event: EventObjectInput, delta: Duration, revertFunc: () => void, jsEvent: Event, ui?: JQuery<HTMLElement>, view?: any) => {
                let dataRow = this.data.rows[event.dataIndex];

                if ((event.start as Moment).hasTime() && (event.end as Moment).hasTime()) {
                    dataRow[this.startDateField] = (event.start as Moment).local(true).toDate();
                    dataRow[this.endDateField] = (event.end as Moment).local(true).toDate();
                }
                else {
                    dataRow[this.startDateField] = (event.start as Moment).local(true).toDate();
                    dataRow[this.endDateField] = undefined;
                }

                this.data = this.data;
                this.visibleData = this.visibleData;

                this.jqElement.triggerHandler('CalendarDidModifyEvents');
            },
            eventResize: (event: EventObjectInput, delta: Duration, revertFunc: () => void, jsEvent: Event, ui?: JQuery<HTMLElement>, view?: any) => {
                let dataRow = this.data.rows[event.dataIndex];

                dataRow[this.startDateField] = (event.start as Moment).local(true).toDate();
                dataRow[this.endDateField] = (event.end as Moment).local(true).toDate();

                this.data = this.data;
                this.visibleData = this.visibleData;

                this.jqElement.triggerHandler('CalendarDidModifyEvents');
            }
        };

        let calendar = this.jqElement.fullCalendar($.extend({}, BaseCalendarConfiguration, runtimeConfiguration));

        this.calendar = this.jqElement.fullCalendar('getCalendar');
    }

    handleSelectionUpdate(propertyName: string, selectedIndices: number[], selectedRows: any[]) {
        this.selectedIndices = selectedIndices;
        this.calendar.refetchEvents();
    }

    resize() {
        this.calendar.render();
    }

    updateProperty(info: TWUpdatePropertyInfo): void {
    }

    beforeDestroy?(): void {
        // resetting current widget
    }
}
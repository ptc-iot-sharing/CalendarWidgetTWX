import { ThingworxRuntimeWidget, TWService, TWProperty } from 'typescriptwebpacksupport/widgetruntimesupport'
import '@fullcalendar/core/locales-all'
import { Calendar, OptionsInput, EventApi, EventInput, Duration, View } from '@fullcalendar/core'
import { EventSourceError } from '@fullcalendar/core/structs/event-source'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { BaseCalendarConfiguration } from './internalLogic/defaultConfiguration'

declare global {
    interface NodeList {
        [Symbol.iterator]: () => Iterator<Element>;
    }
    interface HTMLCollection {
        [Symbol.iterator]: () => Iterator<Element>;
    }
}

/**
 * Returns a copy of the given infotable.
 * @param table The infotable to copy.
 * @return      An infotable.
 */
function _copyInfotable(table: TWInfotable): TWInfotable {
    return {dataShape: table.dataShape, rows: table.rows.map(row => {
        const newRow = {};
        for (const key in row) {
            newRow[key] = row[key];
        }

        return newRow;
    })};
}

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

        this.calendar.setOption('editable', editableBool);
        this.calendar.setOption('eventDurationEditable', editableBool);
        this.calendar.setOption('eventStartEditable', editableBool);
    }

    /**
     * The infotable field representing the name.
     */
    @TWProperty('EventNameField') nameField: string;

    /**
     * The infotable field representing the name.
     */
    @TWProperty('EventDescriptionField') descriptionField: string;

    /**
     * The infotable field representing the start date.
     */
    @TWProperty('EventStartDateField') startDateField: string;

    /**
     * The infotable field representing the end date, for events that are not all-day events.
     */
    @TWProperty('EventEndDateField') endDateField: string;

    /**
     * The infotable field represeting the event ID.
     */
    @TWProperty('EventIDField') IDField: number;

    /**
     * Controls what views are available.
     */
    @TWProperty('Views') view: string;

    /**
     * Controls whether the header is visible.
     */
    @TWProperty('ShowHeader') showHeader: boolean;

    /**
     * Represents the last clicked date.
     */
    @TWProperty('ClickedDate') clickedDate: Date;

    /**
     * An infotable containing the currently visible data.
     */
    private _visibleData: TWInfotable;

    /**
     * An infotable containing the currently visible data.
     */
    @TWProperty('VisibleData') visibleData: TWInfotable;

    /**
     * The data source.
     */
    @TWProperty('Data')
    set data(data: TWInfotable) {
        this._visibleData = {
            dataShape: {fieldDefinitions: {}},
            rows: []
        };

        if (data) {
            this._visibleData.dataShape.fieldDefinitions = JSON.parse(JSON.stringify(data.dataShape.fieldDefinitions));
            // Create a copy of the data for use
            this.setProperty('Data', _copyInfotable(data));
        }


        this.calendar.refetchEvents();
    }

    /**
     * The state definition controlling what each event looks like.
     */
    @TWProperty('EventStates') states: any;

    /**
     * Controls the minimum interval by which events can be moved.
     */
    @TWProperty('DragInterval') dragInterval: string;

    @TWProperty('Locale')
    set locale(locale: string) {
        if (this.calendar) {
            this.calendar.setOption('locale', locale);
        }
    }

    /**
     * Controls how much time each week view row should take.
     */
    @TWProperty('WeekSlotDuration') weekSlotDuration: string;

    /**
     * Controls the visibility of the all day slot.
     */
    @TWProperty('ShowAllDaySlot') showAllDaySlot: boolean;

    /**
     * Controls whether drag to select is enabled.
     */
    @TWProperty('DragToSelect') dragToSelect: boolean; 

    /**
     * Controls whether dragging to select creates an event.
     */
    @TWProperty('DragToCreateEvent') dragToCreateEvent: boolean;

    /**
     * Controls whether click to select is enabled.
     */
    @TWProperty('ClickToSelect') clickToSelect: boolean;

    /**
     * Controls whether double clicking creates an event.
     */
    @TWProperty('DoubleClickToCreateEvent') doubleClickToCreateEvent: boolean;

    @TWProperty('NewEventName') newEventName: string;
    @TWProperty('NewEventProperties') newEventProperties: string;

    /**
     * Represents the start date of the currently selected range.
     */
    @TWProperty('SelectionStart') selectionStart: Date;

    /**
     * Represents the end date of the currently selected range.
     */
    @TWProperty('SelectionEnd') selectionEnd: Date;

    @TWProperty('MiniCalendar') miniCalendar: boolean;

    selectedIndices: number[] = [];

    serviceInvoked(name: string): void {
        throw new Error("Method not implemented.");
    }

    renderHtml(): string {
        require("./styles/common.css");
        require('@fullcalendar/core/main.css');
        require('@fullcalendar/daygrid/main.css');
        require('@fullcalendar/timegrid/main.css');
        return '<div class="widget-content CalendarWidget"></div>';
    }
    
    events: (({start, end, timezone}: {start: Date, end: Date, timezone: any}, callback: (events: EventInput[]) => void, error: (err: EventSourceError) => void) => void) = ({start, end, timezone}, callback, error) => {
        if (!this.data) return callback([]);

        let startTimestamp = +start;
        let endTimestamp = +end;

        let events: EventInput[] = [];

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
                            extendedProps: {dataIndex: i},
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
                            extendedProps: {dataIndex: i},
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
                        extendedProps: {dataIndex: i},
                        className: this.eventClass,
                        allDay: true
                    })
                }
            }
        }

        this.visibleData = this._visibleData;
        callback(events);
    };

    /**
     * The last modified event.
     */
    modifiedEvent?: EventApi;

    /**
     * Set to `true` while awaiting for the second click to trigger an interval selection.
     */
    private _selectionStarted: boolean = false;

    /**
     * When click to select is enabled, this will temporarily hold the start date of the selection,
     * until a second click selects the complete interval.
     */
    private _selectionStartDate: Date;

    /**
     * Set to true if this is a mini calendar.
     */
    private _isMiniCalendar: boolean = false;

    @TWService('ClearSelection')
    clearSelection() {
        this.calendar.select(0, 0);

        this.selectionStart = undefined;
        this.selectionEnd = undefined;

        this.jqElement.triggerHandler('SelectionDidChange');
    }

    async afterRender(): Promise<void> {
        this.boundingBox.addClass('CalendarBoundingBox');

        let doubleClickTimeout;

        // Tracks whether the mouse moves during selection
        let mouseDidMove = false;
        // Represents the mouseup event that triggers a selection
        let mouseupSelectionEvent;

        this.jqElement[0].addEventListener('mousedown', event => {
            mouseupSelectionEvent = undefined;
            mouseDidMove = undefined;

            const mousemoveListener = event => {
                mouseDidMove = true;
            }

            const mouseupListener = event => {
                mouseupSelectionEvent = event;
                
                window.removeEventListener('mousemove', mousemoveListener, true);
                window.removeEventListener('mouseup', mouseupListener, true);
            }

            window.addEventListener('mousemove', mousemoveListener, true);
            window.addEventListener('mouseup', mouseupListener, true);
        });
        
        let runtimeConfiguration: OptionsInput = {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            timeZone: 'UTC',
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
            slotDuration: this.weekSlotDuration || '00:30:00',
            allDaySlot: this.showAllDaySlot === undefined ? true : this.showAllDaySlot,
            defaultView: this.view.indexOf(',') == -1 ? this.view : 'timeGridWeek',
            locale: this.locale,
            height: this.jqElement[0].offsetHeight || 'auto',
            selectable: this.dragToSelect,
            unselectAuto: false,
            navLinks: true,
            eventClick: ({el: node, event: calendarEvent, jsEvent: event, view: any}: {el: HTMLElement, event: EventApi, jsEvent: MouseEvent, view: any}) => {
                if (event.ctrlKey || event.metaKey) {
                    let index = this.selectedIndices.indexOf(calendarEvent.extendedProps.dataIndex);

                    if (index != -1) {
                        this.selectedIndices.splice(index, 1);
                        this.updateSelection('Data', this.selectedIndices);
                        this.calendar.refetchEvents();
                    }
                    else {
                        this.selectedIndices.push(calendarEvent.extendedProps.dataIndex);
                        this.updateSelection('Data', this.selectedIndices);
                        this.calendar.refetchEvents();
                    }
                }
                else {
                    // Select the event
                    this.updateSelection('Data', [calendarEvent.extendedProps.dataIndex]);
                    this.selectedIndices = [calendarEvent.extendedProps.dataIndex];
                    this.calendar.refetchEvents();
                }
            },
            eventRender: ({isMirror, isStart, isEnd, event, el: element, view}: {isMirror: boolean, isStart: boolean, isEnd: boolean, event: EventApi, el: HTMLElement, view: any}) => {
                // Set the description, if it exists
                if (this.descriptionField) {
                    const descriptionText = this.data.rows[event.extendedProps.dataIndex][this.descriptionField];
                    if (descriptionText) {
                        const description = document.createElement('div');
                        description.className = 'fc-title CalendarWidgetDescription';
                        description.style.opacity = '.66';
                        description.innerText = descriptionText;
                        element.children[0].appendChild(description);
                    }
                }

                // Apply the per-event state formatting
                if (!this.states) return;

                let dataRow = this.data.rows[event.extendedProps.dataIndex];
                let isSelected = this.selectedIndices.indexOf(event.extendedProps.dataIndex) != -1 || dataRow._isSelected;

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

                element.setAttribute('style', (element.getAttribute('style') || '') + attributes);
            },
            eventDrop: ({event, delta, oldEvent, revert, jsEvent, el: node, view}: {event: EventApi, oldEvent: EventApi, delta: Duration, revert: () => void, jsEvent: Event, el: HTMLElement, view?: any}) => {
                let dataRow = this.data.rows[event.extendedProps.dataIndex];

                if (!event.allDay) {
                    dataRow[this.startDateField] = event.start;
                    dataRow[this.endDateField] = event.end;
                }
                else {
                    dataRow[this.startDateField] = event.start;
                    dataRow[this.endDateField] = undefined;
                }

                this.data = this.data;
                this.visibleData = this.visibleData;

                this.modifiedEvent = event;
                this.jqElement.triggerHandler('CalendarDidModifyEvents');
            },
            eventResize: ({event, startDelta, endDelta, revert, jsEvent, el, view, prevEvent}: {event: EventApi, prevEvent: EventApi, startDelta: Duration, endDelta: Duration, revert: () => void, jsEvent: Event, el: HTMLElement, view?: any}) => {
                let dataRow = this.data.rows[event.extendedProps.dataIndex];

                dataRow[this.startDateField] = event.start;
                dataRow[this.endDateField] = event.end;

                this.data = this.data;
                this.visibleData = this.visibleData;

                this.modifiedEvent = event;
                this.jqElement.triggerHandler('CalendarDidModifyEvents');
            },
            navLinkDayClick: async (date: Date, jsEvent: MouseEvent) => {
                this.clickedDate = date;
                this.jqElement.trigger('UserDidClickDate');

                if (this.clickToSelect) {
                    await 0;
                    if (this._selectionStarted) {
                        this._selectionStarted = false;
                        const minDate = +this._selectionStartDate > +date ? date : this._selectionStartDate;
                        const maxDate = +this._selectionStartDate > +date ? this._selectionStartDate: date;
                        this.calendar.select(minDate, +maxDate + 24 * 60 * 60 * 1000);
                    }
                    else {
                        this._selectionStarted = true;
                        this._selectionStartDate = date;
                    }
                }
            },
            datesRender: ({view, el}: {view: View, el: HTMLElement}) => {
                this.setProperty('ViewStartDate', +view.currentStart);
                this.setProperty('ViewEndDate', +view.currentEnd);
                this.jqElement.triggerHandler('ViewDidChange');
            },
            dayRender: ({el: cell, date}: {date: Date, el: HTMLTableDataCellElement, view: View}) => {
                const td = cell;

                if (this._isMiniCalendar) {
                    td.innerHTML = `<span class="CalendarWidgetMiniDate">${date.getDate().toFixed()}</span>`;
                }
            },
            select: ({start, end, jsEvent}: {start: Date, end: Date, jsEvent: MouseEvent}) => {
                this.selectionStart = start;
                this.selectionEnd = end;

                this.jqElement.triggerHandler('SelectionDidChange');

                let createEvent = false;

                if (!this.data) return;

                if (this.dragToCreateEvent && mouseDidMove && mouseupSelectionEvent == jsEvent) {
                    createEvent = true;
                }

                if (this.doubleClickToCreateEvent) {
                    if (doubleClickTimeout) {
                        createEvent = true;
                        doubleClickTimeout = undefined;
                    }
                    else {
                        doubleClickTimeout = window.setTimeout(() => {
                            doubleClickTimeout = undefined;
                        }, 100);
                    }
                }

                if (createEvent) {
                    const event: EventInput = {};

                    event[this.startDateField] = start;
                    event[this.endDateField] = end;
                    event[this.nameField] = this.newEventName || 'New Event';
                    if (this.newEventProperties) {
                        try {
                            const properties = JSON.parse(this.newEventProperties);
                            for (const key in properties) {
                                event[key] = properties[key];
                            }
                        }
                        catch (e) {
                            // The only likely error is that the JSON parsing fails; in this case fail silently
                        }
                    }

                    this.data.rows.push(event);
                    this.setProperty('Data', this.data);
                    this.jqElement.triggerHandler('CalendarDidCreateEvent');
                    this.calendar.refetchEvents();
                }
            }
        };

        if (!this.showHeader) {
            this.jqElement[0].classList.add('CalendarWidgetNoHeader');
        }

        let calendar = new Calendar(this.jqElement[0], $.extend({}, BaseCalendarConfiguration, runtimeConfiguration));

        this.calendar = calendar;

        const width = this.jqElement[0].offsetWidth;
        const height = this.jqElement[0].offsetHeight;

        if (width < 500 || height < 500) {
            if (this.miniCalendar) {
                this._isMiniCalendar = true;
                this.jqElement[0].classList.add('CalendarWidgetMini');
            }
        }
        else {
            this._isMiniCalendar = false;
            this.jqElement[0].classList.remove('CalendarWidgetMini');
        }

        await 0;
        this.resize(this.jqElement[0].offsetWidth, this.jqElement[0].offsetHeight);

        // Add an observer to handle selection text color
        const observer = new MutationObserver((mutationRecords: MutationRecord[], observer: MutationObserver) => {
            if (!this._isMiniCalendar) return;

            // For mini calendar, determine if a highlight skeleton was added
            for (const mutationRecord of mutationRecords) {
                // Ensure that the modified element is a week row
                const target = <HTMLElement>mutationRecord.target;
                if (!target.classList.contains('fc-week')) return;

                // Check if a highlight skeleton was added
                for (const node of mutationRecord.addedNodes) {
                    if (node.classList.contains('fc-highlight-skeleton')) {
                        // If it does, add the corresponding class to the week names
                        const tr: HTMLTableRowElement = node.querySelector('tr');
                        const contentRow = target.querySelector('.fc-bg > table > tbody > tr');

                        let index = 0;
                        for (const cellNode of tr.children) {
                            // The selection highlight is made up of one block for the selected area and up to two blocks for the unselected area
                            const cell = <HTMLTableDataCellElement>cellNode;
                            // Colspan is used to control how many cells are selected
                            const length = index + cell.colSpan;
                            // The cell with the fc-highlight class represents the selection
                            const isSelected = cellNode.classList.contains('fc-highlight');

                            // Run through the cells and apply the selection class accordingly
                            for (; index < length; index++) {
                                if (isSelected) {
                                    contentRow.children[index].classList.add('CalendarWidgetMiniDateSelected');
                                }
                                else {
                                    contentRow.children[index].classList.remove('CalendarWidgetMiniDateSelected');
                                }
                            }
                        }
                    }
                }

                // Check if a highlight was removed and clear out the selection from that row
                for (const node of mutationRecord.removedNodes) {
                    if (node.classList.contains('fc-highlight-skeleton')) {
                        [...target.querySelectorAll('.fc-bg > table > tbody > tr > td')].forEach(cell => cell.classList.remove('CalendarWidgetMiniDateSelected'));
                    }
                }
            }
        });

        observer.observe(this.jqElement[0], {subtree: true, childList: true});

    }

    handleSelectionUpdate(propertyName: string, selectedRows: number[], selectedIndices: any[]) {
        this.selectedIndices = selectedIndices || [];
        this.calendar.refetchEvents();
    }

    resize(width: number, height: number) {
        if (this.miniCalendar) {
            if (width < 500 || height < 500) {
                this.jqElement[0].classList.add('CalendarWidgetMini');
                this.calendar.setOption('header', {
                    left: 'title',
                    center: '',
                    right: 'prev,next'
                });
            }
            else {
                this.jqElement[0].classList.remove('CalendarWidgetMini');
                this.calendar.setOption('header', {
                    left: 'prev,next today',
                    center: 'title',
                    right: this.view.indexOf(',') == -1 ? '' : this.view
                });
            }
        }
    
        this.calendar.setOption('height', height);
        this.calendar.render();

        if (this.miniCalendar) {
            const cell = (<HTMLElement>this.jqElement[0].querySelector('.fc-bg .fc-day'));
            this.jqElement[0].style.setProperty('--selection-border-radius', (cell.offsetHeight / 2) + 'px');
            this.jqElement[0].style.setProperty('--today-border-radius', (Math.min(cell.offsetHeight, cell.offsetWidth) / 2) + 'px');
            const today = (<HTMLElement>this.jqElement[0].querySelector('.fc-bg .fc-day:not(.fc-today)'));
            this.jqElement[0].style.setProperty('--today-size', Math.min(today.offsetHeight, today.offsetWidth) + 'px');
        }
    }

    updateProperty(info: TWUpdatePropertyInfo): void {
        if (info.TargetProperty == 'SelectionStart') {
            this.selectionStart = info.RawSinglePropertyValue;
            if (this.selectionEnd) this.calendar.select(this.selectionStart, +this.selectionEnd + 24 * 60 * 60 * 1000)
        }
        if (info.TargetProperty == 'SelectionEnd') {
            this.selectionEnd = info.RawSinglePropertyValue;
            if (this.selectionStart) this.calendar.select(this.selectionStart, +this.selectionEnd + 24 * 60 * 60 * 1000)
        }
    }

    beforeDestroy?(): void {
        // resetting current widget
    }
}
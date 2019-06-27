import { ThingworxRuntimeWidget, TWService, TWProperty } from './support/widgetRuntimeSupport'
import 'fullcalendar'
import '../node_modules/fullcalendar/dist/locale-all'
import Calendar from 'fullcalendar/Calendar'
import { OptionsInput, EventObjectInput, View } from 'fullcalendar';
import { BaseCalendarConfiguration } from './internalLogic/defaultConfiguration';
import { Moment, Duration } from 'moment';

declare global {
    interface NodeList {
        [Symbol.iterator]: () => Iterator<Element>;
    }
    interface HTMLCollection {
        [Symbol.iterator]: () => Iterator<Element>;
    }
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

        this.calendar.option('editable', editableBool);
        this.calendar.option('eventDurationEditable', editableBool);
        this.calendar.option('eventStartEditable', editableBool);
    }

    /**
     * The infotable field representing the name.
     */
    @TWProperty('EventNameField') nameField: string;

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
            this.calendar.option('locale', locale);
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
     * Controls whether click to select is enabled.
     */
    @TWProperty('ClickToSelect') clickToSelect: boolean;

    /**
     * Represents the start date of the currently selected range.
     */
    @TWProperty('SelectionStart') selectionStart: Date;

    /**
     * Represents the end date of the currently selected range.
     */
    @TWProperty('SelectionEnd') selectionEnd: Date;

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
            slotDuration: this.weekSlotDuration || '00:30:00',
            allDaySlot: this.showAllDaySlot === undefined ? true : this.showAllDaySlot,
            defaultView: this.view.indexOf(',') == -1 ? this.view : 'agendaWeek',
            locale: this.locale,
            height: this.jqElement[0].offsetHeight || 'auto',
            selectable: this.dragToSelect,
            unselectAuto: false,
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
            },
            dayClick: async (date: Moment, jsEvent: MouseEvent, view: View, resourceObj?: any) => {
                this.clickedDate = date.toDate();
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
                        this._selectionStartDate = date.toDate();
                    }
                }
            },
            viewRender: (view: View, el: JQuery) => {
                this.setProperty('ViewStartDate', +view.intervalStart);
                this.setProperty('ViewEndDate', +view.intervalEnd);
                this.jqElement.triggerHandler('ViewDidChange');
            },
            dayRender: (date: Moment, cell: JQuery<HTMLTableDataCellElement>) => {
                const td = cell[0];

                if (this._isMiniCalendar) {
                    td.innerHTML = `<span class="CalendarWidgetMiniDate">${date.date().toFixed()}</span>`;
                }
            },
            select: (start: Moment, end: Moment) => {
                const endDate = end.toDate();
                endDate.setDate(endDate.getDate() - 1);

                this.selectionStart = start.toDate();
                this.selectionEnd = endDate;
            }
        };

        let calendar = this.jqElement.fullCalendar($.extend({}, BaseCalendarConfiguration, runtimeConfiguration));

        this.calendar = this.jqElement.fullCalendar('getCalendar');

        const width = this.jqElement[0].offsetWidth;
        const height = this.jqElement[0].offsetHeight;

        if (width < 500 || height < 500) {
            this._isMiniCalendar = true;
            this.jqElement[0].classList.add('CalendarWidgetMini');
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

    handleSelectionUpdate(propertyName: string, selectedIndices: number[], selectedRows: any[]) {
        this.selectedIndices = selectedIndices;
        this.calendar.refetchEvents();
    }

    resize(width: number, height: number) {
        if (width < 500 || height < 500) {
            this.jqElement[0].classList.add('CalendarWidgetMini');
            this.jqElement.fullCalendar('option', 'header', {
                left: 'title',
                center: '',
                right: 'prev,next'
            });
        }
        else {
            this.jqElement[0].classList.remove('CalendarWidgetMini');
            this.jqElement.fullCalendar('option', 'header', {
                left: 'prev,next today',
                center: 'title',
                right: this.view.indexOf(',') == -1 ? '' : this.view
            });
        }

        this.jqElement.fullCalendar('option', 'height', height);
        this.calendar.render();

        const cell = (<HTMLElement>this.jqElement[0].querySelector('.fc-bg .fc-day'));
        this.jqElement[0].style.setProperty('--selection-border-radius', (cell.offsetHeight / 2) + 'px');
        this.jqElement[0].style.setProperty('--today-border-radius', (Math.min(cell.offsetHeight, cell.offsetWidth) / 2) + 'px');
        const today = (<HTMLElement>this.jqElement[0].querySelector('.fc-bg .fc-day:not(.fc-today)'));
        this.jqElement[0].style.setProperty('--today-size', Math.min(today.offsetHeight, today.offsetWidth) + 'px');
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
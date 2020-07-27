# 2.0.0

Support for Thingworx 9.

The version of FullCalendar used has been upgraded to v4. This removes dependency on jQuery and moment, both of which are included with Thingworx and can have breaking changes between Thingworx releases.

A new **EventDescriptionField** property has been added that can be used to display a description or additional information for an event. This will appear below the event name using a lighter font.

Event names are now rendered with a larger font.

A new **ShowHeader** property has been added that can be used to hide the calendar header, containing the title, navigation buttons and view options.

A new **DragToCreateEvent** property can be enabled to cause drag selections to be automatically turned into new events. The **NewEventName** and **NewEventProperties** properties can be used to specify defaults values that will be used for newly created events. The **CalendarDidCreateEvent** event can now be used to respond to events being created in this way.

The mini calendar is now optional and can be enabled and disabled through the **MiniCalendar** property. The calendar will still only use the mini style at small sizes, even when this property is enabled.

Resolved an issue that caused the backdrop filter applied to events to be rendered improperly.

The calendar's timezone will now be set to UTC by default. This resolves an issue that would cause events to appear with a different time than their value on the server. An option to configure this will be added in a future release.

The IDE preview has been temporarily removed due to some issues with the Thingworx Composer.

# 1.5.5

When the calendar has less than 500 pixels in any dimension it will now switch to a mini month view.

# 1.2

Added a new `ShowAllDaySlot` property that can be used to control the visibility of the "all day" events at the top of the calendar.

# 1.1

Added a new `WeekSlotDuration` property that can be used to specify how much time each week view row should represent.
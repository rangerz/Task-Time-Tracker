//
//  Global
//  IntervalID:  The ID of the currently running timer interval.
//  ID:  A monotonically increasing value to use for generating new task IDs.
var IntervalID = 0,
    ID = 0;



//------------------------------------------------------------------------------
//
//  Return the next Task ID to be used in the task chiclet DIV.
//
//------------------------------------------------------------------------------
function NextTaskID ( )
{
    return( ID++ );
}

//------------------------------------------------------------------------------
//
//  Retrieve the TaskArr JSON string from DOM storage, convert it into a
//  JavaScript object, and return it.  If there is no TaskArr in DOM storage, 
//  return an empty JavaScript object.
//
//------------------------------------------------------------------------------
function RetrieveTaskArr ( )
{
    var TaskArr_JSON = "",
        TaskArr = {};

    if ( localStorage.getItem("TaskArr") )
    {
        TaskArr_JSON = localStorage.getItem("TaskArr");
        TaskArr      = JSON.parse(TaskArr_JSON);
    }

    return ( TaskArr );

} // RetrieveTaskArr


//------------------------------------------------------------------------------
//
//  Convert the TaskArr to JSON and save it to local DOM storage.
//
//------------------------------------------------------------------------------
function SaveTaskArr ( TaskArr )
{
    var TaskArr_JSON = JSON.stringify(TaskArr);

    localStorage.setItem("TaskArr", TaskArr_JSON);

} // SaveTaskArr


//------------------------------------------------------------------------------
//
//  A linear search through the task array.  Return true if any task's name
//  matches the give TaskName. Otherwise, return false.
//
//------------------------------------------------------------------------------
function TaskAlreadyExistsinArr ( TaskArr, TaskName )
{
    for ( var Task in TaskArr )
    {
        if ( TaskArr[Task].Name == TaskName )
        {
            return true;
        }
    }

    return false;

} // TaskAlreadyExistsinArr


//------------------------------------------------------------------------------
//
//  Via CSS, make the task chiclet appear active.
//
//------------------------------------------------------------------------------
function ActivateTask ( TaskID )
{
    var TaskObj  = $( '#' + TaskID ),
        CloseObj = TaskObj.parent().find( '#' + TaskID + '_remove' );

    if ( TaskObj.hasClass('task_mouseover') )
    {
        TaskObj.removeClass( 'task_mouseover' )
               .addClass( 'task_current_mouseover' );
    }
    else if ( TaskObj.hasClass( 'task_inactive' ) )
    {
        TaskObj.removeClass( 'task_inactive' )
               .addClass( 'task_current' );
    }

    CloseObj.removeClass ( 'close_task_div_inactive' )
            .addClass ( 'close_task_div_active' );


} // ActivateTask


//------------------------------------------------------------------------------
//
//  Via CSS, make the task chiclet appear inactive.
//
//------------------------------------------------------------------------------
function DeactivateTask ( TaskID )
{
    var TaskObj = $( '#' + TaskID );
        CloseObj = TaskObj.parent().find( '#' + TaskID + '_remove' );

    if ( TaskObj.hasClass('task_current_mouseover') )
    {
        TaskObj.removeClass( 'task_current_mouseover' ).
                addClass( 'task_mouseover' );
    }
    else if ( TaskObj.hasClass('task_current') )
    {
        TaskObj.removeClass( 'task_current' )
               .addClass( 'task_inactive' );
    }

    CloseObj.removeClass ( 'close_task_div_active' )
            .addClass ( 'close_task_div_inactive' );

} // DeactivateTask


//------------------------------------------------------------------------------
//
//  Stop the currently active task and, if the user clicked on an inactive task,
//  start that task's timer.
//
//------------------------------------------------------------------------------
function StartTimer ( event )
{
    var TaskID = $(this).attr("id"),
        $this  = $(this),
        Timer;

    if (IntervalID != 0)
    {
        //  Stop the currently running timer
        clearInterval( IntervalID );
        IntervalID = 0;
    }
    
    if ( $this.attr("id") == localStorage.CurrentTaskID )
    {
        //  User clicked on the current task.  Clear the current task, and be
        //  done.
        DeactivateTask ( localStorage.CurrentTaskID );
        localStorage.setItem( "CurrentTaskID", -1 );
    }
    else
    {
        //
        //  User clicked on a task other than the current task.  Start the timer
        //  and record which task is the current one.
        IntervalID = setInterval(function () {
            var TaskArr_JSON = "",
                TaskArr      = {},
                TaskSeconds  = 0,
                TaskMinutes  = 0,
                TaskHours    = 0,
                Task,
                Timer = $this.find( "#timer" );

            TaskArr     = RetrieveTaskArr();
            Task        = TaskArr[TaskID];
            TaskSeconds = parseInt(Task.Seconds);
            TaskMinutes = parseInt(Task.Minutes);
            TaskHours   = parseInt(Task.Hours);

            //
            //  Add one second to the timer.
            if ( TaskSeconds == 59 )
            {
                TaskSeconds = 0;
                if ( TaskMinutes == 59 )
                {
                    TaskMinutes = 0;
                    TaskHours++;
                }
                else
                {
                    TaskMinutes++;
                }
            }
            else
            {
                TaskSeconds++;
            }

            //
            //  Update the timer in the DOM.
            Timer.text(TaskHours + ":" + TaskMinutes + ":" + TaskSeconds);

            //
            //  Save the updated timer to the TaskArr in local DOM storage.
            Task.Seconds    = TaskSeconds.toString();
            Task.Minutes    = TaskMinutes.toString();
            Task.Hours      = TaskHours.toString();
            TaskArr[TaskID] = Task;
            SaveTaskArr ( TaskArr );
        }, 1000); // setInterval

        //
        //  Deactivate the previously current task, if there was one, record the
        //  new current task's name, and active the new current task.
        if ( localStorage.getItem("CurrentTaskID") )
        {
            DeactivateTask ( localStorage.CurrentTaskID );
        }
        localStorage.setItem ( "CurrentTaskID", TaskID );
        ActivateTask ( localStorage.CurrentTaskID );

    } // End of if ( $this.attr("id") == localStorage.CurrentTaskID )

}  // StartTimer


//------------------------------------------------------------------------------
//
//  Remove a task from the DOM and from local DOM storage.
//
//------------------------------------------------------------------------------
function RemoveTask ( event )
{
    var $this     = $(this),
        DivID     = $this.attr("id"),
        TaskArr,
        TaskDelim = DivID.indexOf('_'),
        TaskID    = DivID.substring(0,TaskDelim);

    //
    //  Remove the Task from DOM storage.
    TaskArr = RetrieveTaskArr();
    delete TaskArr[TaskID];
    SaveTaskArr( TaskArr );

    if ( localStorage.CurrentTaskID == TaskID )
    {
        //
        //  If the task we're removing is the CurrentTaskID,
        //  stop the timer and clear the related IntervalID.
        clearInterval( IntervalID );
        IntervalID = 0;
        localStorage.setItem ( 'CurrentTaskID', -1 );
    }

    //
    //  By removing the parent DIV, we remove the entire task from the DOM.
    $this.parent().remove();

} // RemoveTask


//------------------------------------------------------------------------------
//
//  Via CSS, highlight the task chiclet currently under the curser.
//
//------------------------------------------------------------------------------
function MouseEnterTask ( event )
{
    var $this       = $(this),
        DivID       = $this.attr("id"),
        TaskArr,
        TaskDelim   = DivID.indexOf('_'),
        TaskID      = DivID.substring(0,TaskDelim);
        MainTaskDiv = $this.find( '.task_div' );

    if ( MainTaskDiv.hasClass('task_inactive') )
    {
        MainTaskDiv.removeClass( 'task_inactive' )
                   .addClass( 'task_mouseover' );

    }
    else if ( MainTaskDiv.hasClass('task_current') )
    {
        MainTaskDiv.removeClass( 'task_current' )
                   .addClass( 'task_current_mouseover' );
    }

    $this.find ( '#' + TaskID + '_remove' ).show();

} // MouseEnterTask


//------------------------------------------------------------------------------
//
//  Set the CSS of the task chiclet to un-highlighted.
//
//------------------------------------------------------------------------------
function MouseLeaveTask ( event )
{
    var $this       = $(this),
        DivID       = $this.attr("id"),
        TaskArr,
        TaskDelim   = DivID.indexOf('_'),
        TaskID      = DivID.substring(0,TaskDelim);
        MainTaskDiv = $this.find( '.task_div' );

    if ( MainTaskDiv.hasClass("task_mouseover") )
    {
        MainTaskDiv.removeClass( "task_mouseover" )
                   .addClass( "task_inactive" );
    }
    else if ( MainTaskDiv.hasClass("task_current_mouseover") )
    {
        MainTaskDiv.removeClass( "task_current_mouseover" )
                   .addClass( "task_current" );
    }

    $this.find ( '#' + TaskID + '_remove' ).hide();

} // MouseLeaveTask


//------------------------------------------------------------------------------
//
//  Add a task to the TaskArr in local DOM storage and to the DOM.
//
//------------------------------------------------------------------------------
function AddTask ( TaskID, Task )
{
    var CloseButtonDiv,
        MainTaskDiv,
        TaskDiv,
        TaskArr_JSON,
        TaskArr = RetrieveTaskArr();

    //
    //  If we haven't yet run across this task, save it into local DOM
    //  storage.
    //  Note:  the task may be in local DOM storage from a previous page
    //  instance even though it's not in the DOM.
    if ( ! (TaskID in TaskArr) )
    {
        TaskArr[TaskID] = Task;
        SaveTaskArr ( TaskArr );
    }

    //
    //  Create the task chiclet.
    MainTaskDiv = $( '<div id="' + TaskID + '_main"' +
                     'class="main_task_div"></div>' );
    CloseButtonDiv = $( '<div id="' + TaskID + '_remove"' +
                     'class="close_task_div_inactive">&times;</div>' );
    TaskDiv = $( '<div id="' + TaskID + '" class="task_div task_inactive">' +
                     '<div>'            +
                          Task.Name     +
                     '</div>'           +
                     '<div id="timer">' +
                          Task.Hours    + ':' +
                          Task.Minutes  + ':' +
                          Task.Seconds  +
                     '</div>'           +
                 '</div>' );
    MainTaskDiv.append ( CloseButtonDiv );
    MainTaskDiv.append ( TaskDiv );

    //
    //  Add click handlers.
    CloseButtonDiv.hide();
    CloseButtonDiv.click ( RemoveTask );
    TaskDiv.click ( StartTimer );

    //
    //  Add combo MouseEnter and MouseLeave handler.
    MainTaskDiv.hover( MouseEnterTask, MouseLeaveTask );

    //
    //  Add to the DOM.
    $( "#TaskList" ).append( MainTaskDiv );

} // AddTask 


//------------------------------------------------------------------------------
//
//  Submit handler for task submission form at top of page.
//
//------------------------------------------------------------------------------
function SubmitTask ( event )
{
    var FormTextField = $( "#Form_TaskName" ),
        StartTimerField = $( "#StartTimer" ),
        StartTimer = StartTimerField.val(),
        TaskArr,
        TaskName = FormTextField.val(),
        TaskID   = -1;


    event.preventDefault();
    event.stopPropagation();

    //
    //  Clear the form's fields.
    FormTextField.val( '' );
    StartTimerField.val ( 0 );

    if ( TaskName.length > 0 )
    {
        //
        //  Retrieve the TaskArr from local DOM storage and check whether this
        //  task already exists.
        TaskArr = RetrieveTaskArr();

        TaskExists = TaskAlreadyExistsinArr ( TaskArr, TaskName );
        if ( TaskExists )
        {
            //
            //  Let the user know that this task already exists.
            alert ( "That task already exists!" );
        }
        else
        {
            //
            //  Add the task to local DOM storage and to the DOM.
            TaskID = NextTaskID();
            AddTask ( TaskID,
                      { Name   : TaskName,
                        Hours  : 0,
                        Minutes: 0,
                        Seconds: 0 } );

            if ( StartTimer == 1 )
            {
                //
                //  The user wants the timer started once the task has been
                //  added to the DOM.  To start the timer, simulate a click
                //  event on the task chiclet.
                $( '#' + TaskID ).trigger ( 'click' );
            }

        }

    } // End if ( TaskName.length > 0 ) 

    return TaskID;

} // SubmitTask


//------------------------------------------------------------------------------
//
//  Run once the DOM is fully built.  This is basically main().
//
//------------------------------------------------------------------------------
$(document).ready(function () {
    var TaskArr,
        TaskID_int;

    $( '#TrackTimeButton' ).on( 'click', function(event) {
        //
        //  Set the hidden form value to true to let the submit task
        //  handler know that the timer should also be started.
        $( "#StartTimer" ).val ( 1 );
    });

    //
    //  Submit handler for the task form.
    $( '#TaskForm' ).submit( SubmitTask );

    //
    //  Looks like a previous instance of this program stored some tasks in DOM
    //  storage.  Retrieve and display them.
    TaskArr = RetrieveTaskArr();
    for ( var TaskID in TaskArr )
    {
        //
        //  TaskID comes from an array that's been stored in JSON format.  Every        //  scalar has been restored from JSON back into a JavaScript string.
        //  So, parse the ID into an int.
        TaskID_int = parseInt( TaskID );

        AddTask ( TaskID, TaskArr[TaskID] );
        if ( TaskID_int >= ID )
        {
            //
            //  Set the global ID to one larger than the largest Task ID that we
            //  found in in local DOM storage.
            ID = TaskID_int + 1;
        }
    }

}); // $(document).ready()

//
// vim: ts=4 sw=4 expandtab
//

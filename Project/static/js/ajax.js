// Whole page is self-programmed but AI supported (specifically set to 'do not show result in answer')
// Enable self-learning taking me several hours

// ToDo: Create main.js reference sub-JSscripts

// Declare dropdown options as global variables on load (AI instructed)
let dropdownTemplates = {};

// Update the task table (create, edit, delete, )
$(document).ready(function() {

    // Save dropdown options globally (AI instructed) - used for edit & its helpers functions
    dropdownTemplates = {
        category: $("#newTaskCategory").clone().removeAttr("id name"),
        interval: $("#newTaskInterval").clone().removeAttr("id name")
    };

    // For task creation, add task to upper table, sorted by duedate
    $('#createTask').submit(function(e) {
        e.preventDefault(); // Prevents form submission (default)
        let formComplete = true; // Check for correct sumbission

        // Clear previous error messages (within form)
        $(this).find('input, select').removeClass('border-danger');
        $(this).find('.error').hide().text('');

        // Create form dictionary
        const formData = $(this).serializeArray();
        const formDataDict = {};


        formData.forEach(item => {
            formDataDict[item.name] = item.value;
        });


        // Task Name: not empty (FE/BE), no duplicate (BE)
        if (!formDataDict["taskName"]) {
            setError("missingTaskName", "newTaskName", "taskNameError");
            formComplete = false;
        }

        // Category: not empty (FE/BE), within valid selection (BE)
        if (!formDataDict["taskCategory"]) {
            setError("missingCategory", "newTaskCategory", "taskCategoryError");
            formComplete = false;
        }

        // Interval: not empty (FE/BE), within valid selection (BE)
        if (!formDataDict["taskInterval"]) {
            setError("missingInterval", "newTaskInterval", "taskIntervalError");
            formComplete = false;
        }

        // Start Date: not empty (FE/BE), valid ISO format (FE/BE)
        if (!formDataDict["startDate"] || !isISODate(formDataDict["startDate"])) {
            setError("missingDate", "setStartDate", "taskDateError");
            formComplete = false;
        }

        // Reference form to clear the form's fields it in case of successful response
        const formRef = this;

        // AJAX, POST/CREATE task request
        if (formComplete) {
            $.ajax({
                url: "/tasks",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(formDataDict),
                success: function(response) {
                    addToTaskTable(response);

                    // Clear form fields
                    defaultDate = setDate(undefined, undefined, 7);

                    $(formRef).find('input[type="text"], textarea').val('');
                    $(formRef).find('input[type="date"]').val(defaultDate);
                    $(formRef).find('select').prop('selectedIndex', 0);
                },
                error: function(response) {
                    const data = response.responseJSON;

                    if (data.field_id && data.message_id) {
                        setError(data.error, data.field_id, data.message_id);
                    } else {
                        showGeneralError(data.error, data.message_id);
                    }
                }
            });
        };
    });

    // Edit button, dynamic for each row
    $("#taskTable").on("click", ".btn-primary", function() {

        debugger;

        // Return all table rows in 'editing' and revert to original
        const $editingRow = $("#taskTable").find('tr[data-state="editing"]');
        if ($editingRow.length) {
            changeButtonStatus($editingRow, "default");
            makeDefaultRow($editingRow, $editingRow.data("originalRowData"));
        };

        // Remove the previsouly markers for a row in Editing mode
        $editingRow.removeData("originalRowData");
        $editingRow.removeAttr("data-state");


        // Find referenced row
        const $row = $(this).closest("tr");

        if (!$row.length) {
            console.error("No row found for this button");
            return;
        }

        // Hide completion field & change edit and delete button to submit and discard (same color, same button elements)

        changeButtonStatus($row, "edit");

        // Store field values in row
        originalRowData = extractRowData($row);
        $row.data("originalRowData", originalRowData);
        $row.attr("data-state", "editing");

        // Transform to input fields & populate with stored data
        makeEditableRow($row, originalRowData);
    });


    // Discard button, dynamic for active editing row
    $("#taskTable").on("click", ".btn-outline-danger", function() {

        // Find referenced row
        const $row = $(this).closest("tr");

        if (!$row.length) {
            console.error("No row found for this button");
            return;
        }

        // Set button to default
        changeButtonStatus($row, "default");

        // Set remaining fields to default
        makeDefaultRow($row, $row.data("originalRowData"));

        // Remove the previsouly markers for a row in Editing mode
        $row.removeData("originalRowData");
        $row.removeAttr("data-state");
    });


    // Submit changes of task (row) in table
    $("#taskTable").on("click", ".btn-outline-primary", function() {

        let formComplete = true; // Check for correct sumbission

        debugger;

        // Find referenced row
        const $row = $(this).closest("tr");

        // Clear previous error messages (within form)
        $row.find('input, select').removeClass('border-danger');
        $row.find('.error').hide().text('');

        // Create form dictionary
        const formDataDict = {};

        $row.find("td input, select, textarea").each(function() {
            const name = $(this).attr("name");
            if (name) {
                formDataDict[name] = $(this).val();
            }
        })

        // Task Name: not empty (FE/BE), no duplicate (BE)
        if (!formDataDict["rowTaskName"]) {
            setError("missingTaskName", "editedTaskName", "rowTaskNameError");
            formComplete = false;
        }

        // Category: not empty (FE/BE), within valid selection (BE)
        if (!formDataDict["rowTaskCategory"]) {
            setError("missingCategory", "editedTaskCategory", "rowTaskCategoryError");
            formComplete = false;
        }

        // Interval: not empty (FE/BE), within valid selection (BE)
        if (!formDataDict["rowTaskInterval"]) {
            setError("missingInterval", "editedTaskInterval", "rowTaskIntervalError");
            formComplete = false;
        }

        // Start Date: not empty (FE/BE), valid ISO format (FE/BE)
        if (!formDataDict["rowStartDate"] || !isISODate(formDataDict["rowStartDate"])) {
            setError("missingDate", "resetDate", "rowTaskDateError");
            formComplete = false;
        }

        // Stop if there is any error
        if (formComplete === false) {
            return;
        }

        // Reference id to pass AJAX
        const taskId = $row.data("taskId");
        console.log(taskId);

        // ToDo: Only send the data that is actually updated

        // AJAX, POST/CREATE task request
        if (formComplete) {
            $.ajax({
                url: `/tasks/${taskId}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(formDataDict),
                success: function(response) {

                    $row.remove();
                    addToTaskTable(response);

                },
                error: function(response) {
                    const data = response.responseJSON;

                    if (data.field_id && data.message_id) {
                        setError(data.error, data.field_id, data.message_id);
                    } else {
                        showGeneralError(data.error, data.message_id);
                    }
                }
            });
        };
    });


    // Delete button, dynamic for each row
    $("#taskTable").on("click", ".btn-danger", function() {

        const $row = $(this).closest("tr");

        if (!$row.length) {
            console.error("No row found for this button");
            return;
        }

        const taskId = $row.data("taskId");

        // Bad design: Error message for taskId relies on taskId iteslf (but is named index)
        // ToDo: Improve error design and use taskId independent error message (e.g. Toast)
        if (!taskId) {
            const index = $(this).closest("tr").data("taskId");
            showGeneralError("dataReturnError", `completionBtnError${index}`);
        }

        $.ajax({
            url: `/tasks/${taskId}`,
            method: "DELETE",
            success: function(response) {
                console.log(response);

                // Clear row from table
                $row.remove()

            },
            error: function(response) {
                const data = response.responseJSON;

                // ToDo: Create a better way to display the errors

                showGeneralError(data.error, data.message_id);

            }
        });
    });

    // Complete button, dynamic for each row
    $("#taskTable").on("click", ".btn-success", function() {

        const $row = $(this).closest("tr");

        if (!$row.length) {
            console.error("No row found for this button");
            return;
        }

        const taskId = $row.data("taskId");
        const completion = setDate(undefined, undefined, undefined); // using completion date
        const intervalI18n = $row.find("td[data-role='interval']").data("i18n");
        const interval = intervalI18n ? intervalI18n.split(":")[1] : 0;

        // Bad design: Error message for taskId relies on taskId iteslf (but is named index)
        // ToDo: Improve error design and use taskId independent error message (e.g. Toast)
        if (!taskId || !completion || !interval) {
            const index = $(this).closest("tr").data("taskId");
            showGeneralError("dataReturnError", `completionBtnError${index}`);
        }

        // Todo: Imporve the design of the payload for only required data (future plan: possibly adjust interval if needed)
        const taskData = {
            "completion": completion,
            "interval": interval
        };

        $.ajax({
            url: `/tasks/${taskId}/complete`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify(taskData),
            success: function(response) {

                // Clear row from table
                $row.remove()

                // Add the new row if not deleted ('oneOff' interval)
                if (!response.delete) {
                    addToTaskTable(response);
                }
            },
            error: function(response) {
                const data = response.responseJSON;

                // ToDo: Create a better way to display the errors

                showGeneralError(data.error, data.message_id);

            }
        });
    });
});


/**************************************************
 *Helper Functions
 **************************************************/


// ToDo: Bring together with planner.js and make planner.js function more dynamic
// Reset form date after task creation
function setDate(years, months, days) {
    const today = new Date();

    if (years === undefined) years = 0;
    if (months === undefined) months = 0;
    if (days === undefined) days = 0;

    today.setFullYear(today.getFullYear() + years);
    today.setMonth(today.getMonth() + months);
    today.setDate(today.getDate() + days);

    const defaultDate = today.toISOString().split('T')[0];

    return defaultDate
};

// Mark error message
function setError(errorKey, fieldId, messageId) {
    $(`#${fieldId}`).addClass('border-danger');

    // Build translation key (AI suggested & generated)
    const translationKey = `common:error.message.${errorKey}`;

    // Keep error message dynamic on language change (AI generated line):
    $(`#${messageId}`)
        .attr('data-i18n', translationKey)
        .text(i18next.t(translationKey))
        .show();
};


// Show general errors  // Added through AI, adapted to my codespace
function showGeneralError(errorKey, messageId) {
    const translationKey = `common:error.message.${errorKey}`;

    $(`#${messageId}`)
        .attr('data-i18n', translationKey)
        .text(i18next.t(translationKey))
        .show();
};


// Check date for ISO format & real date
function isISODate(str) {
    // AI provided regression to check format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(str)) return false;

    // Check for real date
    const date = new Date(str);
    return (!isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === str);
};


// Add Task to 'Task' table
function addToTaskTable(task) {
    const newRow = $(`<tr data-task-id="${task.id}" data-deadline="${task.deadline}">
                        <td data-role="btn-completion">
                            <button class="btn btn-sm btn-success">
                                <i class="bi bi-check2-circle"></i>
                            </button>
                             <p id="completionBtnError${task.id}" class="error"></p>
                        </td>
                        <td data-role="deadline">
                            ${task.deadline}
                        </td>
                        <td data-role="taskName">
                            ${task.task_name}
                        </td>
                        <td data-i18n="tasks:${task.category}" data-role="category">
                            ${task.category}
                        </td>
                        <td data-i18n="tasks:${task.interval}" data-role="interval">
                            ${task.interval}
                        </td>
                        <td data-role="info">
                            ${task.info}
                        </td>
                        <td data-role="btn-change">
                            <button class="btn btn-sm btn-primary" data-role="edit">
                                <i class="bi bi-pencil-square"></i>
                                <span data-i18n="common:edit">Edit</span>
                            </button>

                            <button class="btn btn-sm btn-danger" data-role="delete">
                                <i class="bi bi-trash"></i>
                                <span data-i18n="common:delete">Delete</span>
                            </button>
                        </td>
                    </tr>`.trim());


    // Edge case: First entry, table non-existent
    if ($("#taskTable tbody tr").length === 0) {
        $("#taskTableContainer").html(`
            <div class="display-page pt-4">
                <h2 data-i18n="tasks:index.upcomingItems" class="mb-4 font-red">Upcoming Tasks</h2>

                <table id="taskTable" class="table table-borderless border-0">
                    <thead>
                        <tr class="border-bottom">
                            <th data-i18n="tasks:index.items.dueDate">Due Date</th>
                            <th data-i18n="tasks:index.items.taskName">Task</th>
                            <th data-i18n="tasks:index.items.category">Category</th>
                            <th data-i18n="tasks:index.items.interval">Interval</th>
                            <th data-i18n="tasks:index.items.info">Information</th>
                            <th>Edit, Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${newRow[0].outerHTML}
                    </tbody>
                </table>
            </div>`);

        // Translate the newly generated inputs
        $("#taskTableContainer").localize();
    }

    // Add task to 'Task' table
    else {
        const index = findInsertIndex(task.deadline, task.id);
        const rows = $("#taskTable tbody tr");

        // Insert at the end of the list or before the found row
        if (index < rows.length) {
            newRow.insertBefore(rows.eq(index));
            // $("#taskTable tbody").before(newRow);
        } else {
            $("#taskTable tbody").append(newRow);
        }

        // Translate the newly generated inputs
        newRow.localize();
    }
};


// Filter table by deadline (/date)
function findInsertIndex(deadline, taskId) {
    const rows = $("#taskTable tbody tr");
    const len = rows.length;

    // Check Edge case
    const first = $(rows[0]);
    const last = $(rows[len - 1]);

    const lastDeadline = last.data("deadline");
    const lastId = last.data("taskId");

    if (deadline > lastDeadline || (deadline === lastDeadline && taskId > lastId)) {
        return len;
    }

    const firstDeadline = first.data("deadline");
    const firstId = first.data("taskId");

    if (deadline < firstDeadline || (deadline === firstDeadline && taskId < firstId)) {
        return 0;
    }

    // Binary search
    let left = 0;
    let right = len;

    while (left < right) {

        const mid = Math.floor((left + right) / 2);
        const midDeadline = $(rows[mid]).data("deadline");
        const midId = $(rows[mid]).data("taskId");

        if (deadline < midDeadline || (deadline === midDeadline && taskId < midId)) {
            right = mid;
        } else if (deadline > midDeadline || (deadline === midDeadline && taskId > midId)) {
            left = mid + 1;
        }
    }

    return left;
};

// Change button status - now variable input, no change
function changeButtonStatus($row, mode) {

    // Buttons into 'edit' mode
    if (mode === "edit") {

        // Hide Completion Button
        $row.find("td[data-role='btn-completion'] button")
            .hide()
            .prop("disabled", true);

        // Change Edit to Submit button
        $row.find("td[data-role='btn-change'] button[data-role='edit'] i")
            .removeClass("bi-pencil-square").addClass("bi-check2-circle");
        $row.find("td[data-role='btn-change'] button[data-role='edit'] span")
            .text("Submit")
            .attr("data-i18n", "common:submit");
        $row.find("td[data-role='btn-change'] button[data-role='edit']")
            .removeClass("btn-primary").addClass("btn-outline-primary");

        // Change Delete to Discard button
        $row.find("td[data-role='btn-change'] button[data-role='delete'] i")
            .removeClass("bi-trash").addClass("bi-eraser");
        $row.find("td[data-role='btn-change'] button[data-role='delete'] span")
            .text("Discard")
            .attr("data-i18n", "common:discard");
        $row.find("td[data-role='btn-change'] button[data-role='delete']")
            .removeClass("btn-danger").addClass("btn-outline-danger");

        // Buttons into 'read-only' (default) mode
    } else if (mode === "default") {

        // Show Completion Button
        $row.find("td[data-role='btn-completion'] button")
            .show()
            .prop("disabled", false);

        // Change Submit to Edit button
        $row.find("td[data-role='btn-change'] button[data-role='edit'] i")
            .removeClass("bi-check2-circle").addClass("bi-pencil-square");
        $row.find("td[data-role='btn-change'] button[data-role='edit'] span")
            .text("Edit")
            .attr("data-i18n", "common:edit");
        $row.find("td[data-role='btn-change'] button[data-role='edit']")
            .removeClass("btn-outline-primary").addClass("btn-primary");

        // Change Discard to Delete button
        $row.find("td[data-role='btn-change'] button[data-role='delete'] i")
            .removeClass("bi-eraser").addClass("bi-trash");
        $row.find("td[data-role='btn-change'] button[data-role='delete'] span")
            .text("Delete")
            .attr("data-i18n", "common:delete");
        $row.find("td[data-role='btn-change'] button[data-role='delete']")
            .removeClass("btn-outline-danger").addClass("btn-danger");
    }

    $row.find("button").localize();
}


// Get the task data from a row (Edit and subsequent submit fucntionality)
function extractRowData($row) {
    return {
        "taskId": $row.data("taskId"),
        "deadline": $row.find("td[data-role='deadline']").text().trim(),
        "taskName": $row.find("td[data-role='taskName']").text().trim(),
        "category": $row.find("td[data-role='category']").data("i18n"),
        "interval": $row.find("td[data-role='interval']").data("i18n"),
        "info": $row.find("td[data-role='info']").text().trim(),
    };
}

// Make task row editable and populate input (AI guided)
function makeEditableRow($row, rowData) {

    // Adjust rowData's format to dropdown value's format (remove namespace), cause: function extractRowData($row)
    const postCategory = splitReturnSegment(rowData.category, ":", 1);
    const postInterval = splitReturnSegment(rowData.interval, ":", 1);

    // Setup dropdown selections
    let $categorySelect = dropdownTemplates.category.clone();
    $categorySelect.val(postCategory);
    $categorySelect.addClass("form-control");
    $categorySelect.attr("name", "rowTaskCategory");
    $categorySelect.attr("id", "editedTaskCategory");

    let $intervalSelect = dropdownTemplates.interval.clone();
    $intervalSelect.val(postInterval);
    $intervalSelect.addClass("form-control");
    $intervalSelect.attr("name", "rowTaskInterval");
    $intervalSelect.attr("id", "editedTaskInterval");

    // Make fields editable
    $row.find("td[data-role='deadline']").html(`
        <input type="date" name="rowStartDate" id="resetDate" class="form-control" value="${rowData.deadline}" required>
        <p id="rowTaskDateError" class="error"></p>`);
    $row.find("td[data-role='taskName']").html(`
        <input type="text" name="rowTaskName" id="editedTaskName" autocomplete="off" class="form-control" value="${rowData.taskName}" required>
        <p id="rowTaskNameError" class="error"></p>`);
    $row.find("td[data-role='category']")
        .empty()
        .append($categorySelect)
        .append('<p id="rowTaskCategoryError" class="error"></p>');
    $row.find("td[data-role='interval']")
        .empty()
        .append($intervalSelect)
        .append('<p id="rowTaskIntervalError" class="error"></p>');
    $row.find("td[data-role='info']").html(`
        <textarea name="rowItemInfo" class="form-control">${rowData.info}</textarea>`);

    // Translate the dropdown options
    $categorySelect.find("option").localize();
    $intervalSelect.find("option").localize();
}


// Split a string at a defined space and select which segemnt to return
function splitReturnSegment(input, splitRule, segmentNo) {
    const preSplit = input || '';
    const postSplit = preSplit.includes(splitRule) ?
        preSplit.split(splitRule)[segmentNo].trim() :
        preSplit; // Fallback, does not include ":"
    return postSplit;
}

// Return task row to read-only
function makeDefaultRow($row, rowData) {

    if (!rowData) return;

    // Make fields editable
    $row.find("td[data-role='deadline']").text(rowData["deadline"].trim());
    $row.find("td[data-role='taskName']").text(rowData["taskName"].trim());
    $row.find("td[data-role='category']").text(rowData["category"].trim())
        .attr("data-i18n", rowData["category"].trim());
    $row.find("td[data-role='interval']").text(rowData["interval"].trim())
        .attr("data-i18n", rowData["interval"].trim());
    $row.find("td[data-role='info']").text(rowData["info"].trim());

    $row.localize();
}

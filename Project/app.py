from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from flask import Flask, jsonify, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import login_required, execute_query

# Configure flask application
app = Flask(__name__)

# Configure session
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


# Disable caching like in the Finance task (copied)
@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# GENERAL ToDO: Filter data retrieve from DB rigorously (after checking correct implementation) and check if filtering before sending to FE is required

# Different Routes for the planner


@app.route("/", methods=["GET"])
@login_required
def index():

    # Load existing task, deadline ASC id ASC, changes in ORDER BY influence jQuery results
    task_list = execute_query(
        "SELECT * FROM tasks WHERE user_id = :user ORDER BY deadline ASC, id ASC", {'user': session["user_id"]})

    # ToDo: Create a re-usable function to retrieve the user's tasks
    # ToDo: Only hand first 10 tasks to FE
    # ToDo: Serialization required before parsing to FE

    # Load the <select> options for FE
    select_options = execute_query("SELECT * FROM select_options")

    # ToDo: Serialization required before parsing to FE
    return render_template("index.html", selectOptions=select_options, taskList=task_list)

# Task creation (POST)


@app.route("/tasks", methods=["POST"])
@login_required
def tasks():

    # Import data
    data = request.get_json()

    # ToDo: Serialize the FE data to snake_case

    # Import Task Name
    task = data.get("taskName")
    if not task:
        print("Intentional: missingTaskName")
        return jsonify({"error": "missingTaskName", "field_id": "newTaskName", "message_id": "taskNameError"}), 400

    # User's tasks, duplicate check (only)
    task_list = execute_query(
        "SELECT * FROM tasks WHERE user_id = :user ORDER BY deadline ASC, id ASC", {'user': session["user_id"]})

    # Check for duplicate names in user's tasks
    name_bool = False
    for entry in task_list:
        if entry["task_name"] == task:
            name_bool = True
            break
    if name_bool:
        print("Intentional: duplicateTask")
        return jsonify({"error": "duplicateTask", "field_id": "newTaskName", "message_id": "taskNameError"}), 400

    # Load the <select> options for BE validation
    select_options = execute_query("SELECT * FROM select_options")

    # Import Task Category
    category = data.get("taskCategory")
    if not category:
        print("Intentional: missingCategory")
        return jsonify({"error": "missingCategory", "field_id": "newTaskCategory", "message_id": "taskCategoryError"}), 400

    category_bool = False
    for option in select_options:
        if option["dropdown_name"] == "taskCategory" and option["i18n"] == category:
            category_bool = True
            break
    if not category_bool:
        print("Intentional: wrongCategory")
        return jsonify({"error": "wrongCategory", "field_id": "newTaskCategory", "message_id": "taskCategoryError"}), 400

    # Import Task Interval
    interval = data.get("taskInterval")
    if not interval:
        print("Intentional: missingInterval")
        return jsonify({"error": "missingInterval", "field_id": "newTaskInterval", "message_id": "taskIntervalError"}), 400

    interval_bool = False
    for option in select_options:
        if option["dropdown_name"] == "taskInterval" and option["i18n"] == interval:
            interval_bool = True
            break
    if not interval_bool:
        print("Intentional: wrongInterval")
        return jsonify({"error": "wrongInterval", "field_id": "newTaskInterval", "message_id": "taskIntervalError"}), 400

    # Import Date (next occurence / start)
    try:
        deadline = date.fromisoformat(data.get("startDate"))
    except ValueError:
        print("Intentional: wrongDateFormat")
        return jsonify({"error": "wrongDateFormat", "field_id": "setStartDate", "message_id": "taskDateError"}), 400

    if not deadline:
        print("Intentional: missingDate")
        return jsonify({"error": "missingDate", "field_id": "setStartDate", "message_id": "taskDateError"}), 400

    # Import optional info field
    info = data.get("newItemInfo")

    # Save Data in DB
    new_task = "INSERT INTO tasks (user_id, task_name, category, interval, deadline, info) VALUES (:user, :task, :category, :interval, :deadline, :info)"
    params = {'user': session["user_id"], 'task': task, 'category': category,
              'interval': interval, 'deadline': deadline, 'info': info}

    # ToDo: Serialization required before parsing to FE
    try:
        response = execute_query(new_task, params, "new")

        if response is None:
            return jsonify({"error": "dataReturnError", "field_id": None, "message_id": "generalErrorMessage"}), 500

        return jsonify(response), 200

    except ValueError:
        print("Intentional: databaseError")
        return jsonify({"error": "databaseError", "field_id": None, "message_id": "generalErrorMessage"}), 500

# Modify task: Modify or delete task


@app.route("/tasks/<int:task_id>", methods=["DELETE", "PUT"])
@login_required
def modify_tasks(task_id):

    # Delete task
    if request.method == "DELETE":
        try:
            execute_query("DELETE FROM tasks WHERE user_id = :user AND id = :id",
                          {'user': session["user_id"], 'id': task_id})
            response = {'delete': True}
            return jsonify(response), 200
        except ValueError:
            print("Intentional: databaseError")
            return jsonify({"error": "databaseError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

    # Save the edits in the DB:
    elif request.method == "PUT":

        # Import data
        data = request.get_json()

        # ToDo: Serialize the FE data to snake_case

        # Import Date (next occurence / start)
        try:
            deadline = date.fromisoformat(data.get("rowStartDate"))
        except ValueError:
            print("Intentional: wrongDateFormat")
            return jsonify({"error": "wrongDateFormat", "field_id": "resetDate", "message_id": "rowTaskDateError"}), 400

        if not deadline:
            print("Intentional: missingDate")
            return jsonify({"error": "missingDate", "field_id": "resetDate", "message_id": "rowTaskDateError"}), 400

        # Import Task Name
        task = data.get("rowTaskName")
        if not task:
            print("Intentional: missingTaskName")
            return jsonify({"error": "missingTaskName", "field_id": "editedTaskName", "message_id": "rowTaskNameError"}), 400

        # User's tasks, duplicate check (only)
        task_list = execute_query("SELECT * FROM tasks WHERE user_id = :user AND id != :id ORDER BY deadline ASC, id ASC", {
                                  'user': session["user_id"], 'id': task_id})

        # Check for duplicate names in user's tasks
        name_bool = False
        for entry in task_list:
            if entry["task_name"] == task:
                name_bool = True
                break
        if name_bool:
            print("Intentional: duplicateTask")
            return jsonify({"error": "duplicateTask", "field_id": "editedTaskName", "message_id": "rowTaskNameError"}), 400

        # Load the <select> options for BE validation
        select_options = execute_query("SELECT * FROM select_options")

        # Import Task Category
        category = data.get("rowTaskCategory")
        if not category:
            print("Intentional: missingCategory")
            return jsonify({"error": "missingCategory", "field_id": "editedTaskCategory", "message_id": "rowTaskCategoryError"}), 400

        category_bool = False
        for option in select_options:
            if option["dropdown_name"] == "taskCategory" and option["i18n"] == category:
                category_bool = True
                break
        if not category_bool:
            print("Intentional: wrongCategory")
            return jsonify({"error": "wrongCategory", "field_id": "editedTaskCategory", "message_id": "rowTaskCategoryError"}), 400

        # Import Task Interval
        interval = data.get("rowTaskInterval")
        if not interval:
            print("Intentional: missingInterval")
            return jsonify({"error": "missingInterval", "field_id": "rowTaskInterval", "message_id": "rowTaskIntervalError"}), 400

        interval_bool = False
        for option in select_options:
            if option["dropdown_name"] == "taskInterval" and option["i18n"] == interval:
                interval_bool = True
                break
        if not interval_bool:
            print("Intentional: wrongInterval")
            return jsonify({"error": "wrongInterval", "field_id": "rowTaskInterval", "message_id": "rowTaskIntervalError"}), 400

        # Import optional info field
        info = data.get("rowItemInfo")

        # ToDo: Only send, change and return data that was really updated in the FE (and is valid)

        # Save Data in DB
        update_task = "UPDATE tasks SET task_name=:task, category=:category, interval=:interval, deadline=:deadline, info=:info WHERE user_id=:user AND id = :id"
        params = {'user': session["user_id"], 'id': task_id, 'task': task,
                  'category': category, 'interval': interval, 'deadline': deadline, 'info': info}

        print("Checks complete")

        # ToDo: Serialization required before parsing to FE
        try:
            response = execute_query(update_task, params, task_id)

            if response is None:
                return jsonify({"error": "dataReturnError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

            return jsonify(response), 200

        except ValueError:
            print("Intentional: databaseError")
            return jsonify({"error": "databaseError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

    else:
        return jsonify({"error": "databaseError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

# Modify task: Complete Task


@app.route("/tasks/<int:task_id>/complete", methods=["PUT"])
@login_required
def update_task(task_id):

    # ToDo: Use payload data to determine new Deadline and possibly new interval
    data = request.get_json()

    # ToDo: Add the check for time zone differences, and reference to standard time zone
    # Check data payload:
    try:
        completion_date = date.fromisoformat(data.get("completion"))
    except ValueError:
        print("Intentional: wrongDateFormat")
        return jsonify({"error": "wrongDateFormat", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 400

    if not completion_date or str(completion_date) != str(date.today()):
        print("FE & BE date do not match")
        completion_date = date.today()

    # ToDo: Use Interval payload data (currently only referring to DB result)

    # Retrieve db data
    task_info = execute_query(
        "SELECT id, category, interval, deadline FROM tasks WHERE id = :task_id", {'task_id': task_id})

    # Prepare params for task
    params = {'user': session["user_id"], 'id': task_id}

    # ToDo: Change the task interval if required

    # ToDo: Enable custom date selection

    # Delete 'OneOff' tasks
    if task_info[0]["interval"] == "selectOption.oneOff":
        try:
            execute_query("DELETE FROM tasks WHERE user_id = :user AND id = :id", params)
            response = {'delete': True}
            return jsonify(response), 200
        except ValueError:
            print("Intentional: databaseError")
            return jsonify({"error": "databaseError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

    # Set new deadline for the tasks with fixed intervals
    if task_info[0]["interval"] == "selectOption.daily":
        new_deadline = completion_date + relativedelta(days=1)
        params['deadline'] = new_deadline

    elif task_info[0]["interval"] == "selectOption.weekly":
        new_deadline = completion_date + relativedelta(days=7)
        params['deadline'] = new_deadline

    elif task_info[0]["interval"] == "selectOption.biWeekly":
        new_deadline = completion_date + relativedelta(days=14)
        params['deadline'] = new_deadline

    elif task_info[0]["interval"] == "selectOption.monthly":
        new_deadline = completion_date + relativedelta(days=30)
        params['deadline'] = new_deadline

    elif task_info[0]["interval"] == "selectOption.yearly":

        # ToDo: Separate the Birthday from tasks table and configure neatly (current design is bad)
        # Make a difference between Birthday and task
        if task_info[0]["category"] == "selectOption.birthday":
            # Quick and dirty implementation:
            next_week = date.today() + relativedelta(days=7)
            birthday_date = datetime.strptime(task_info[0]["deadline"], "%Y-%m-%d").date()

            # Allow completion only 1 week ahead of the birthday
            if birthday_date > next_week:
                return jsonify({"error": "tempBirthday", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

            # Assuming birthdays are being kept up to date within a year
            else:
                next_birthday = birthday_date + relativedelta(years=1)
                params['deadline'] = next_birthday

        else:
            new_deadline = completion_date + relativedelta(years=1)
            params['deadline'] = new_deadline

    # Update DB and subsequently FE (for fixed interval lengths)
    update_deadline = "UPDATE tasks SET deadline = :deadline WHERE user_id = :user AND id = :id"

    # ToDo: Serialization required before parsing to FE
    try:
        response = execute_query(update_deadline, params, task_id)

        if response is None:
            return jsonify({"error": "dataReturnError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500

        return jsonify(response), 200

    except ValueError:
        print("Intentional: databaseError")
        return jsonify({"error": "databaseError", "field_id": None, "message_id": f"completionBtnError{task_id}"}), 500


# Login with your profile ('Finance' problem set inspired)
@app.route("/login", methods=["GET", "POST"])
def login():

    # Clear session before rendering Login page
    session.clear()

    # Check login credentials after submit
    if request.method == "POST":

        # Input values
        name = request.form.get("placeholderUsername")
        password = request.form.get("placeholderPassword")

        # Ensure provided username
        if not name:
            return render_template("error.html", error_code=400, error_message="missingUsername")

        # Ensure Password is provided
        elif not password:
            return render_template("error.html", error_code=400, error_message="missingPassword")

        # Ensure username and password are correct
        rows = execute_query("SELECT * FROM users WHERE user = :username", {'username': name})
        if not rows or rows[0]['user'] != name or not check_password_hash(rows[0]['password'], password):
            return render_template("error.html", error_code=400, error_message="wrongUsernamePassword")

        # Save current user in session
        session["user_id"] = rows[0]['id']

        return redirect("/")

    # Render login page
    return render_template("login.html")

# Logout with your profile ('Finance' problem set inspired)


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

# Register a new profile


@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        # Input values
        name = request.form.get("placeholderUsername")
        password = request.form.get("placeholderPassword")
        pass_confirm = request.form.get("placeholderPasswordConfirmation")

        # Check if there is input
        if not name:
            return render_template("error.html", error_code=400, error_message="missingUsername")

        elif not password or not pass_confirm:
            return render_template("error.html", error_code=400, error_message="missingPassword")

        # Check if passwords are identical
        if password != pass_confirm:
            return render_template("error.html", error_code=400, error_message="differentPassword")

        # Check if the user already exists in db
        exists = execute_query("SELECT * FROM users WHERE user = :username", {'username': name})
        if exists:
            return render_template("error.html", error_code=400, error_message="existingUsername")

        # Save to DB & redirect to /login
        user_creation = {'username': name, 'hash': generate_password_hash(
            password, method='scrypt', salt_length=16)}
        execute_query("INSERT INTO users (user, password) VALUES (:username, :hash)", user_creation)

        return redirect("/login")

    # Render page for GET request
    else:
        return render_template("register.html")

# Handle 404 and 500 error (ChatGPT provided)
# Trial for successful implementation (ChatGPT provided)


@app.route('/trigger-error')
def trigger_error():
    # Manually raise a 404 for demonstration
    return render_template('error.html', error_code=404, error_message=404), 404

# 404 Error (ChatGPT provided)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_code=404, error_message=404), 404

# 500 Error (ChatGPT provided)


@app.errorhandler(500)
def internal_error(e):
    return render_template('error.html', error_code=500, error_message=500), 500


@app.route("/error")
# @login_required
def error():
    return render_template("error.html")


# Ensure runnning app
if __name__ == "__main__":
    app.run

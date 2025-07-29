from flask import redirect, session
from functools import wraps
from sqlalchemy import create_engine, text

# login_required logic, copied from Finance to advance with project content sooner


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function

# Executes a parameterized SQL query for tasks (learnt from ChatGPT, self-adapted)


def execute_query(query, params=None, update=None):
    """
    Parameter binding: protect from injection attacks (ChatGPT)

    Example Usage:
    sql_query = "SELECT * FROM users WHERE age > :min_age AND city = :city"
    parameters = {'min_age': 18, 'city': 'New York'}
    rows = execute_query(sql_query, parameters, connection)
    """
    engine = create_engine("sqlite:///planner.db")

    with engine.begin() as connection:
        result = connection.execute(text(query), params or {})
        print(result)

        # For Select request
        if result.returns_rows:
            return [dict(row) for row in result.mappings().all()]

        # Adding new task and returning data including new ID
        if update == "new":
            task_new = connection.execute(
                text("SELECT * FROM tasks WHERE id = last_insert_rowid()"))
            return dict(task_new.mappings().first())

        # Returning all data of updated task
        if update and update != "new":
            task_update = connection.execute(
                text("SELECT * FROM tasks WHERE id = :task_id"), {'task_id': update})
            return dict(task_update.mappings().first())

        # No response required
        return None


# Currently not planned to use, but I might use nested list or dictionaires at some point
# ChatGPT created after informing myself about nameing convetions in full-stack environment

# # Convert to CamelCase (in BE)
# def to_camel_case(snake_str):
#     parts = snake_str.split('_')
#     return parts[0] + ''.join(word.capitalize() for word in parts[1:])

# # Convert (nested) dicts, lists to CamelCase


# def to_camel_case_recursive(obj):
#     if isinstance(obj, dict):
#         return {
#             to_camel_case(k): to_camel_case_recursive(v)
#             for k, v in obj.items()
#         }
#     elif isinstance(obj, list):
#         return [
#             to_camel_case_recursive(i)
#             if isinstance(i, (dict, list)) else i
#             for i in obj
#         ]
#     else:
#         return obj

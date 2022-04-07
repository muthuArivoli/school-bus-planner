from flask import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy.orm import Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy_filters.operators import OrOperator
from flask_cors import CORS, cross_origin
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, unset_jwt_cookies, jwt_required, JWTManager, verify_jwt_in_request
from datetime import datetime, timedelta, timezone, date
import json
import sys
import logging
import bcrypt
import math
import requests
import os
import geopy.distance
import googlemaps
import pandas as pd
from io import TextIOWrapper
from werkzeug.utils import secure_filename
import csv
import re
from apscheduler.schedulers.background import BackgroundScheduler


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+psycopg2://postgres:bus@db:5432/db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "29F884FD9AB88942F0A959BA7B8E4D2C4C60A190E71571BB80FFF3DDC0F4D0E9"
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)
ROWS_PER_PAGE = 10

db = SQLAlchemy(app)
cors = CORS(app)
api = Blueprint('api', __name__)
gmaps_key = googlemaps.Client(key="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o")

from models import User, Student, School, Route, Stop, Login, Bus, Log, UserFilter, StudentFilter, SchoolFilter, RouteFilter, LogFilter, TokenBlocklist, RoleEnum

db.create_all()

jwt = JWTManager(app)
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

YOUR_DOMAIN_NAME="mail.hypotheticaltransportfive.email"
API_KEY = open('email_api.key', 'r').read().strip().replace('\n', '')

DOMAIN = os.getenv("DOMAIN", "https://htfive.colab.duke.edu")

ALLOWED_EXTENSIONS = set(['csv'])

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
    return token is not None

# custom decorator 
def admin_required(roles):
    def cust_wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            login = Login.query.filter_by(email = get_jwt_identity()).first()
            user = login.user
            if user is not None:
                if user.role in roles:
                    return fn(*args, **kwargs)
                else:
                    return jsonify(msg="User not authorized to do this action"), 403
            student = login.student
            if student is not None:
                if "Student" in roles:
                    return fn(*args, **kwargs)
                else:
                    return jsonify(msg="User not authorized to do this action"), 403
        return decorator
    return cust_wrapper


#USING JWT EXTENDED LIBRARY
@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
        return response
    except (RuntimeError, KeyError):
        return response

@app.route('/current_user', methods =['OPTIONS'])
@app.route("/current_user/<student_id>", methods = ['OPTIONS'])
@cross_origin()
def current_user_options(student_id=None):
    return {'success':True}

@app.route("/current_user", methods = ['GET'])
@jwt_required()
@cross_origin()
def get_current_user():
    verify_jwt_in_request()
    # user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    if login is None:
        return {'success': False, 'msg': 'Invalid Email'}
    user = login.user
    student = login.student
    returned_obj = {}
    if user is None:
        if student is None:
            return {'success': False, 'msg': 'Invalid User ID'}
        else:
            returned_obj = student.as_dict()
            returned_obj['role'] = 4
    else:
        returned_obj = user.as_dict()
    return {'success': True, 'user': returned_obj}

@app.route("/current_user/<student_id>", methods = ['GET'])
@jwt_required()
@cross_origin()
def get_current_user_student(student_id=None):
    if student_id is None:
        return {'success': False, "msg": "Invalid Query Syntax"}
    verify_jwt_in_request()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    if login is None:
        return {'success': False, "msg": "Invalid User ID"}
    user = login.user
    student = login.student
    if user is None and student is None:
        return {'success': False, "msg": "Invalid User ID"}
    
    if student is not None:
        if student.id != int(student_id):
            return {'success': False, "msg": "Invalid User ID"}

    if user is not None:
        student = Student.query.filter_by(id=student_id).first()
        if student.user_id != user.id:
            return {'success': False, 'msg':"User not authorized to do this action"}

    in_range_stops = []
    if student.route is not None:
        stops = student.route.stops
        for stop in stops:
            if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                in_range_stops.append(stop.as_dict())
    return {'success': True, 'student': student.as_dict(), 'in_range_stops': in_range_stops}

@app.route("/current_user", methods = ['PATCH'])
@jwt_required()
@cross_origin()
def patch_current_user():
    verify_jwt_in_request()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    if login is None:
        return {'success': False, "msg": "Invalid Login"}
    user = login.user
    student = login.student
    if user is None and student is None:
        return {'success': False, 'msg': 'Invalid User or Student Account'}
    content = request.json
    if 'password' in content:
        pswd = content.get('password', None)
        if type(pswd) is not str:
            return {'success': False, "msg": "Invalid Query Syntax"}
        encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
        login.pswd = encrypted_pswd.decode('utf-8')
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
    if 'revoke' in content:
        revoke = content.get('revoke', False)
        if type(revoke) is not bool:
            return {'success': False, "msg": "Invalid Query Syntax"}
        if revoke:
            jti = get_jwt()["jti"]
            try:
                db.session.add(TokenBlocklist(jti=jti))
                db.session.commit()
            except SQLAlchemyError:
                return {'success': False, "msg": "Database Error"}
    return {'success': True}


@app.route('/login', methods = ['POST'])
@cross_origin()
def login():
    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if not email or not password:
        return {'success': False, "msg": "Invalid Query Syntax"}
    login = Login.query.filter(func.lower(Login.email) == func.lower(email)).first()
    # user = User.query.filter(func.lower(User.email) == func.lower(email)).first()
    if not login:
        return {"success": False, "msg": "There is no account associated with that email"}
    if login.pswd is None:
        return {"success": False, "msg": "Password has not been set"} 
    if not bcrypt.checkpw(password.encode('utf-8'), login.pswd.encode('utf-8')):
        return {"success": False, "msg": "Invalid password"}
    access_token = create_access_token(identity=login.email)
    return {"success": True, "access_token": access_token}

@app.route('/logout', methods = ['POST'])
@jwt_required()
@cross_origin()
def logout():
    response = jsonify({"msg":"logout successful"})
    unset_jwt_cookies(response)
    return response

@app.route('/forgot_password', methods = ['POST'])
@cross_origin()
def forgot_password():
    email = request.json.get('email', None)
    if email is None:
        return {'success': False, "msg": "Invalid Query Syntax"}
    login = Login.query.filter_by(email=email).first()
    if not login:
        return {"success": False, "msg": "There is no account associated with that email"}
    access_token = create_access_token(identity=email)

    link = f"{DOMAIN}/resetpassword?token={access_token}"

    logging.info(link)
    r = requests.post(
    f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
    auth=("api", API_KEY),
    data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
        "to": email,
        "subject": "Reset Password Link for Hypothetical Transportation",
        "html": f"Please use the following link to reset the password for your account: \n <a href={link}>{link}</a>"})
    if r.status_code != 200:
        return {'success': False}
    return {"success": True}


@app.route('/check_complete', methods = ['OPTIONS'])
@cross_origin()
def check_comp_options():
    return {'success':True}


@app.route('/check_complete', methods = ['POST'])
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
@cross_origin()
def check_comp():
    content = request.json
    logging.debug(content)
    stops = content.get('stops', [])
    students = content.get('students', [])

    if type(stops) is not list or type(students) is not list:
        logging.debug('not list')
        return {'success': False, "msg": "Invalid Query Syntax"}

    try:
        completion = check_complete(students, stops)
    except Exception:
        logging.debug("EXCEPTION")
        return {'success': False, "msg": "Invalid Query Syntax"}

    return {"success": True, "completion": completion}

#USER CRUD

@app.route('/check_email', methods=['OPTIONS'])
@app.route('/user/<user_id>', methods = ['OPTIONS'])
@app.route('/user', methods = ['OPTIONS'])
@cross_origin()
def user_options(username=None):
    return {'success':True}

@app.route('/check_email', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def get_user_id():
    args = request.args
    email = args.get('email', '')
    parents = args.get('parents', False)
    login = Login.query.filter(func.lower(Login.email) == func.lower(email)).first()
    if login is None:
        return {'success': True, 'id': None}
    user = login.user
    student = login.student

    final = None

    if student is not None:
        if not parents:
            final = student.id
    
    if user is not None:
        if not parents or user.role == RoleEnum.UNPRIVILEGED:
            final = user.id

    return {'success': True, 'id': final}


@app.route('/user/<user_id>', methods = ['GET'])
@app.route('/user', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF, RoleEnum.DRIVER])
def users_get(user_id=None):
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if curr_user is None:
        return {'success': False, "msg": "Invalid User"}

    if user_id is not None:
            
        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success': False, "msg": "Invalid User ID"}

        user_dict = user.as_dict()
        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            access = False
            for school in curr_user.managed_schools:
                for student in school.students:
                    if student.user_id == user.id:
                        access = True
            if not access:
                return {'success': False, "msg": "User does not have permission to view"}
            children = []
            ids = [mschool.id for mschool in curr_user.managed_schools]
            for child in user.children:
                if child.school.id in ids:
                    children.append(child.as_dict())
            user_dict['children'] = children

        return {'success': True, 'user': user_dict}

    args = request.args
    name_search = args.get('name', '')
    email_search = args.get('email', '')
    role_search = args.get('role', None, type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', None)
    page = args.get('page', None, type=int)
        
    base_query = User.query
    record_num = None

    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = set()
        for school in curr_user.managed_schools:
            for student in school.students:
                ids.add(student.user.id)
        base_query = User.query.filter(User.id.in_(ids))

    if role_search is not None:
        base_query = base_query.filter_by(role=RoleEnum(role_search))

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        user_filt = UserFilter(data={'full_name': name_search, 'email': email_search, 'order_by': sort, 'page': page}, query=base_query, operator=OrOperator).paginate()
        users = user_filt.get_objects()
        record_num = user_filt.count
    else:
        user_filt = UserFilter(data={'full_name': name_search, 'email': email_search, 'order_by': sort}, query=base_query, operator=OrOperator)
        users = user_filt.apply()
        record_num = users.count()

    all_users = [user.as_dict() for user in users]
    return {'success': True, "users": all_users, "records": record_num}


@app.route('/user/<user_id>', methods = ['PATCH','DELETE'])
@app.route('/user', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def users(user_id=None):
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if request.method == 'DELETE':
        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success':False, 'msg': 'Invalid Email'}
        
        login = user.login
        students = Student.query.filter_by(user_id = user_id)
        
        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            if user.role != RoleEnum.UNPRIVILEGED:
                return {'success': False, 'msg': 'User has elevated permissions'}
            ids = [school.id for school in curr_user.managed_schools]
            for student in students:
                if student.school.id not in ids:
                    return {'success': False, "msg":"User contains students not managed by you"}

        for student in students:
            db.session.delete(student)
        try:
            db.session.delete(user)
            db.session.delete(login)
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, 'msg': 'Database Error'}
        return {'success': True}
    
    if request.method == 'POST':
        content = request.json
        email = content.get('email', None)
        name = content.get('name', None)
        role = content.get('role', 0)
        phone = content.get('phone', None)

        if not email or not name or role is None or phone is None:
            logging.debug('MISSING A FIELD')
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(email) is not str or type(name) is not str or type(role) is not int or role < 0 or role > 3 or type(phone) is not str:
            logging.debug('WRONG FIELD TYPE')
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if curr_user.role == RoleEnum.SCHOOL_STAFF and role != 0:
            return {'success': False, "msg": "Invalid User Permissions"}

        login = Login.query.filter_by(email = email).first()
        if login:
            return {'success': False, 'msg': 'User with this email exists'}

        new_login = Login(email=email)
        try:
            db.session.add(new_login)
            db.session.flush()
            db.session.refresh(new_login)
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        new_user = User(full_name=name, role=RoleEnum(role), phone=phone, login_id = new_login.id)
        if new_user.role == RoleEnum.UNPRIVILEGED:
            address = content.get('address', None)
            longitude = content.get('longitude', None)
            latitude = content.get('latitude', None)
            if type(address) is not str and type(latitude) is not str and type(longitude) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            new_user.uaddress = address
            new_user.latitude = latitude
            new_user.longitude = longitude
        if new_user.role == RoleEnum.SCHOOL_STAFF:
            managed_schools = content.get('managed_schools', [])
            if type(managed_schools) is not list:
                return {'success': False, "msg": "Invalid Query Syntax"}
            for school_id in managed_schools:
                school = School.query.filter_by(id=school_id).first()
                new_user.managed_schools.append(school)

        try:
            db.session.add(new_user)
            db.session.flush()
            db.session.refresh(new_user)
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        

        access_token = create_access_token(identity=email)
        link = f"{DOMAIN}/resetpassword?token={access_token}"
 
        r = requests.post(
        f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
        auth=("api", API_KEY),
        data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
            "to": email,
            "subject": "Account Creation for Hypothetical Transportation",
            "html": f"Please use the following link to set the password for your new account: \n <a href={link}>{link}</a>"})
        if r.status_code != 200:
            return {'success': False}

        return {'success': True, 'id': new_user.id}

    if request.method == 'PATCH':
        content = request.json

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success': False, 'msg': 'Invalid User'}
        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            access = False
            for school in curr_user.managed_schools:
                for student in school.students:
                    if student.user_id == user.id:
                        access = True
            if not access:
                return {'success': False, "msg": "User does not have permission to modify"}
    
    
        if 'email' in content:
            email = content.get('email', None)
            if type(email) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            email_user = Login.query.filter_by(email=email).first()
            if email_user and email_user.user.id != int(user_id):
                return {'success': False, "msg": "Account already exists with this email"}
            email_user.email = email
        if 'name' in content:
            full_name = content.get('name', None)
            if type(full_name) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.full_name = full_name
        if 'address' in content and user.role == RoleEnum.UNPRIVILEGED:
            address = content.get('address', None)
            longitude = content.get('longitude', None)
            latitude = content.get('latitude', None)
            if not latitude or not longitude:
                return {'success': False, "msg": "Invalid Query Syntax"}
            if type(address) is not str or type(longitude) is not float or type(latitude) is not float:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.uaddress = address
            user.longitude = longitude
            user.latitude = latitude
        if 'role' in content and user.role != RoleEnum.UNPRIVILEGED and curr_user.role == RoleEnum.ADMIN:
            role = content.get('role', None)
            if type(role) is not int or role < 0 or role > 3:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.managed_schools = []
            user.role = RoleEnum(role)
            if user.role == RoleEnum.SCHOOL_STAFF:
                managed_schools = content.get('managed_schools', [])
                if type(managed_schools) is not list:
                    return {'success': False, "msg": "Invalid Query Syntax"}
                for school_id in managed_schools:
                    school = School.query.filter_by(id=school_id).first()
                    user.managed_schools.append(school)
        if 'phone' in content:
            phone = content.get('phone', None)
            if type(phone) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.phone = phone
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True}
    return {'success': False}

#STUDENT CRUD

@app.route('/student/<student_uid>', methods = ['OPTIONS'])
@app.route('/student', methods = ['OPTIONS'])
@cross_origin()
def student_options(student_uid=None):
    return {'success':True}

@app.route('/student/<student_uid>', methods = ['GET'])
@app.route('/student', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF, RoleEnum.DRIVER])
def students_get(student_uid=None):
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if student_uid is not None:
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return {'success': False, 'msg': 'Invalid Student Id'}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [school.id for school in curr_user.managed_schools]
            if student.school.id not in ids:
                return {'success': False, "msg": "User does not have permission to view"}
        return {'success': True, 'student': student.as_dict()}

    args = request.args
    name_search = args.get('name', '')
    id_search = args.get('id', None, type=int)
    email_search = args.get('email', '')
    page = args.get('page', None, type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', None)
    base_query = Student.query
    record_num = None

    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = set()
        for school in curr_user.managed_schools:
            for student in school.students:
                ids.add(student.id)
        base_query = Student.query.filter(Student.id.in_(ids))

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        student_filt = StudentFilter(data={'name': name_search, 'student_id': id_search, 'email': email_search, 'order_by': sort, 'page': page}, query=base_query, operator=OrOperator).paginate()
        students = student_filt.get_objects()
        record_num = student_filt.count
    else:
        student_filt = StudentFilter(data={'name': name_search, 'student_id': id_search, 'email': email_search, 'order_by': sort}, query=base_query, operator=OrOperator)
        students = student_filt.apply()
        record_num = students.count()

    all_students = [student.as_dict() for student in students]
    return {'success':True, "students": all_students, "records": record_num}

@app.route('/student/<student_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/student', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def students(student_uid = None):
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if request.method == 'DELETE':
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return {'sucess': False, 'msg': 'Invalid Student Id'}
        
        login = student.login

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [school.id for school in curr_user.managed_schools]
            if student.school.id not in ids:
                return {'success': False, "msg":"Invalid User Permissions"}

        db.session.delete(student)
        db.session.delete(login)
        db.session.commit()
        return {'success': True}
    
    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)
        user_id = content.get('user_id', None)
        email = content.get('email', None)

        if not name or not school_id or not user_id:
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(name) is not str or type(school_id) is not int or type(user_id) is not int:
            return {'success': False, "msg": "Invalid Query Syntax"}

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success': False, 'msg': 'Student doesn\'t belong to a user'}
        
        if user.role != RoleEnum.UNPRIVILEGED:
            return {'success': False, 'msg': 'Student can\' be added to a privileged role'}

        school = School.query.filter_by(id=school_id).first()
        if school is None:
            return {'success': False, 'msg': 'Student doesn\'t belong to a school'}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [mschool.id for mschool in curr_user.managed_schools]
            if school_id not in ids:
                return {'success': False, "msg":"Invalid User Permissions"}
        
        if email is not None:
            if type(email) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            login = Login(email=email)
            try:
                db.session.add(login)
                db.session.flush()
                db.session.refresh(login)
                new_student = Student(name=name, school_id=school_id, user_id=user_id, login_id = login.id)
                db.session.add(new_student)
                db.session.flush()
                db.session.refresh(new_student)
            except SQLAlchemyError:
                return {'success': False, "msg": "Database Error"}
            except SQLAlchemyError:
                return {'success': False, "msg": "Database Error"}

            access_token = create_access_token(identity=email)
            link = f"{DOMAIN}/resetpassword?token={access_token}"
 
            r = requests.post(
            f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
            auth=("api", API_KEY),
            data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
                "to": email,
                "subject": "Account Creation for Hypothetical Transportation",
                "html": f"Please use the following link to set the password for your new account: \n <a href={link}>{link}</a>"})
            if r.status_code != 200:
                return {'success': False}
        else:
            new_student = Student(name=name, school_id=school_id, user_id=user_id)
            try:
                db.session.add(new_student)
                db.session.flush()
                db.session.refresh(new_student)
            except SQLAlchemyError:
                return {'success': False, "msg": "Database Error"}
        if 'route_id' in content:
            route_id = content.get("route_id", None)
            if type(route_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            new_student.route_id = route_id
        if 'student_id' in content:
            student_id = content.get("student_id", None)
            if type(student_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            new_student.student_id = content['student_id']
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True, 'id': new_student.id}

    if request.method == 'PATCH':
        content = request.json
        student = Student.query.filter_by(id=student_uid).first()

        if student is None:
            return {'success': False, 'msg': 'Invalid Student Id'}
        if 'name' in content:
            name = content.get('name', None)
            if type(name) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            student.name = name
        if 'student_id' in content:
            student_id = content.get('student_id', None)
            if student_id is not None and type(student_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            student.student_id = student_id
        if 'school_id' in content:
            school_id = content.get('school_id', None)
            if type(school_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            
            school = School.query.filter_by(id=school_id).first()
            if school is None:
                return {'success': False, 'msg': 'Student doesn\'t belong to a school'}

            if curr_user.role == RoleEnum.SCHOOL_STAFF:
                ids = [mschool.id for mschool in curr_user.managed_schools]
                if school_id not in ids:
                    return {'success': False, "msg":"Invalid User Permissions"}

            student.school_id = school_id
        if 'route_id' in content:
            route_id = content.get('route_id', None)
            if route_id is not None and type(route_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            student.route_id = route_id
        if 'user_id' in content:
            user_id = content.get('user_id', None)
            if type(user_id) is not int:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user = User.query.filter_by(id=user_id).first()
            if user is None:
                return {'success': False, 'msg': 'Student doesn\'t belong to a user'}
            if user.role != RoleEnum.UNPRIVILEGED:
                return {'success': False, 'msg': 'Student can\'t be added to a privileged role'}
            student.user_id = user_id
        if 'email' in content:
            email = content.get('email', None)
            if email is None and student.login is not None:
                db.session.delete(student.login)
            elif email is not None and student.login is None:
                login = Login(email=email)
                db.session.add(login)
                db.session.flush()
                db.session.refresh(login)
                student.login = login
                access_token = create_access_token(identity=email)
                link = f"{DOMAIN}/resetpassword?token={access_token}"
    
                r = requests.post(
                f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
                auth=("api", API_KEY),
                data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
                    "to": email,
                    "subject": "Account Creation for Hypothetical Transportation",
                    "html": f"Please use the following link to set the password for your new account: \n <a href={link}>{link}</a>"})
                if r.status_code != 200:
                    return {'success': False}
            elif email is not None and student.login is not None:
                student.login.email = email
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True}
    return {'success': False}

#SCHOOL CRUD

@app.route('/school/<school_uid>', methods = ['OPTIONS'])
@app.route('/school', methods = ['OPTIONS'])
@cross_origin()
def schools_options(school_uid=None):
    return {'success':True}

@app.route('/school/<school_uid>', methods = ['GET'])
@app.route('/school', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF, RoleEnum.DRIVER])
def schools_get(school_uid=None):
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if school_uid is not None:

        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return {'success': False, 'msg': 'Invalid School Id'}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [mschool.id for mschool in curr_user.managed_schools]
            if school.id not in ids:
                return {'success': False, "msg": "User does not have permission to view"}
        return {'success': True, 'school': school.as_dict()}

    args = request.args
    name_search = args.get("name", '')
    page = args.get('page',None,type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', 'asc')
    base_query = School.query
    record_num = None

    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = [mschool.id for mschool in curr_user.managed_schools]
        base_query = School.query.filter(School.id.in_(ids))

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        school_filt = SchoolFilter(data={'name': name_search, 'order_by': sort, 'page': page}, query=base_query).paginate()
        schools = school_filt.get_objects()
        record_num = school_filt.count
    else:
        school_filt  = SchoolFilter(data={'name': name_search, 'order_by': sort}, query=base_query)
        schools = school_filt.apply()
        record_num = schools.count()

    all_schools = [school.as_dict() for school in schools]
    return {'success':True, "schools": all_schools, "records": record_num}
     

@app.route('/school/<school_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/school', methods = ['POST'])
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
@cross_origin()
def schools(school_uid = None):  
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if request.method == 'DELETE':
        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            return {'success': False, "msg":"Invalid User Permissions"}
        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return {'success': False, "msg": 'Invalid School Id'}
        routes = Route.query.filter_by(school_id=school.id)
        students = Student.query.filter_by(school_id=school.id)
        for route in routes:
            try:
                db.session.delete(route)
            except SQLAlchemyError:
                return {'success': False, "msg": "Error Deleting Route"}
        for student in students:
            try:
                db.session.delete(student)
            except SQLAlchemyError:
                return {'success': False, "msg": "Error Deleting Student"}
        try:
            db.session.delete(school)
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Error Deleting School"}
        return {'success': True}
    
    if request.method == 'POST':

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            return {'success': False, "msg":"Invalid User Permissions"}
        content = request.json
        name = content.get('name', None)
        address = content.get('address', None)
        longitude = content.get('longitude',None)
        latitude = content.get('latitude', None)
        arrival_time = content.get('arrival_time', None)
        departure_time = content.get('departure_time', None)
        
        #REQUIRED FIELDS
        if not name or not address or not longitude or not latitude or not arrival_time or not departure_time:
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        #TYPE CHECKING
        if type(name) is not str or type(address) is not str or type(longitude) is not float or type(latitude) is not float or type(arrival_time) is not str or type(departure_time) is not str:
            return {'success': False, "msg": "Invalid Query Syntax"}

        parsed_arrival_time = datetime.strptime(arrival_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(microsecond=0)
        parsed_departure_time = datetime.strptime(departure_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(microsecond=0)

        new_school = School(name=name, address=address, longitude=longitude, latitude=latitude, arrival_time=parsed_arrival_time, departure_time=parsed_departure_time)
        try:
            db.session.add(new_school)
            db.session.flush()
            db.session.refresh(new_school)
            db.session.commit()
        except SQLAlchemyError:
            return {"success": False, "msg": "School Name already exists in Database"}
        return {'success': True, 'id': new_school.id}
    
    if request.method == 'PATCH':
        content = request.json

        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return {'success': False, 'msg': 'Invalid School Id'}
        if 'name' in content and curr_user.role == RoleEnum.ADMIN:
            name = content.get('name', None)
            if type(name) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            school.name = name
        if 'address' in content and curr_user.role == RoleEnum.ADMIN:
            address = content.get('address', None)
            longitude = content.get('longitude', None)
            latitude = content.get('latitude', None)
            if not latitude or not longitude:
                return {'success': False, "msg": "Invalid Query Syntax"}
            if type(address) is not str or type(longitude) is not float or type(latitude) is not float:
                return {'success': False, "msg": "Invalid Query Syntax"}
            school.address = address
            school.longitude = longitude
            school.latitude = latitude
        if 'arrival_time' in content:
            arrival_time = content.get('arrival_time', None)
            if type(arrival_time) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            parsed_arrival_time = datetime.strptime(arrival_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(microsecond=0)
            school.arrival_time = parsed_arrival_time
        if 'departure_time' in content:
            departure_time = content.get('departure_time', None)
            if type(departure_time) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            parsed_departure_time = datetime.strptime(departure_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(microsecond=0)
            school.departure_time = parsed_departure_time
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}

        if 'arrival_time' in content or 'departure_time' in content:
            try:
                update_stop_calculations(school)
            except SQLAlchemyError:
                return {'success': False, "msg": "Database Error"}
        return {'success': True}
    return {'success': False}

# ROUTE CRUD

@app.route('/route/<route_uid>', methods = ['OPTIONS'])
@app.route('/route', methods = ['OPTIONS'])
@cross_origin()
def route_options(route_uid=None):
    return {'success':True}

@app.route('/route/<route_uid>', methods = ['GET'])
@app.route('/route', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF, RoleEnum.DRIVER])
def routes_get(route_uid=None):
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    if route_uid is not None:
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return {'success': False, 'msg': 'Invalid Route Id'}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [school.id for school in curr_user.managed_schools]
            if route.school.id not in ids:
                return {'success': False, "msg": "User does not have permission to view"}
        return {'success': True, 'route': route.as_dict()}

    args = request.args
    name_search = args.get('name', '')
    page = args.get('page', None,type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', 'asc')
    base_query = Route.query
    record_num = None

    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = set()
        for school in curr_user.managed_schools:
            for route in school.routes:
                ids.add(route.id)
        base_query = Route.query.filter(Route.id.in_(ids))

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        route_filt = RouteFilter(data={'name': name_search, 'order_by': sort, 'page': page}, query=base_query).paginate()
        routes = route_filt.get_objects()
        record_num = route_filt.count
    else:
        route_filt = RouteFilter(data={'name': name_search, 'order_by': sort}, query=base_query)
        routes = route_filt.apply()
        record_num = routes.count()

    all_routes = [route.as_dict() for route in routes]
    return {'success':True, "routes": all_routes, "records": record_num}


@app.route('/route/<route_uid>', methods = ['PATCH','DELETE'])
@app.route('/route', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def routes(route_uid = None):
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if request.method == 'DELETE':
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return {'success': False, 'msg': 'Invalid Route Id'}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [mschool.id for mschool in curr_user.managed_schools]
            if route.school_id not in ids:
                return {'success': False, "msg":"Invalid User Permissions"}

        students = Student.query.filter_by(route_id=route.id)
        stops = Stop.query.filter_by(route_id=route.id)
        for student in students:
            student.route_id = None
        try:
            for stop in stops:
                db.session.delete(stop)
            db.session.delete(route)
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True}

    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)
        students = content.get('students',[])
        stops = content.get('stops', [])

        if not name or not school_id:
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(name) is not str or type(school_id) is not int or type(stops) is not list or type(students) is not list or not all(isinstance(x, int) for x in students):
            return {'success': False, "msg": "Invalid Query Syntax"}

        school = School.query.filter_by(id=school_id).first()
        if school is None:
            return {'success': False, "msg": "Invalid Query"}

        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [mschool.id for mschool in curr_user.managed_schools]
            if school_id not in ids:
                return {'success': False, "msg":"Invalid User Permissions"}

        new_route = Route(name = name, school_id = school_id)
        try:
            db.session.add(new_route)
            db.session.flush()
            db.session.refresh(new_route)
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        
        for student_num in students:
            logging.debug("in here" + str(student_num))
            student = Student.query.filter_by(id=student_num).first()
            if student:
                student.route_id = new_route.id
        if 'description' in content:
            description = content.get('description', None)
            if type(description) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            new_route.description = description
        
        #ADDED THIS FOR STOPS
        sorted_stops = sorted(stops, key=lambda x: x['index'])
        dropoff_times, pickup_times = get_time_and_dist(sorted_stops, school.departure_time, school.arrival_time, school.latitude, school.longitude)
        for f in range(len(stops)):
            stop_info = sorted_stops[f]
            stop = Stop(name=stop_info['name'], route_id=new_route.id, latitude=stop_info['latitude'], longitude=stop_info['longitude'], index=stop_info['index'], pickup_time=pickup_times[f], dropoff_time=dropoff_times[f])
            db.session.add(stop)
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True, 'id': new_route.id}
    
    if request.method == 'PATCH':
        content = request.json

        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return {'success': False, 'msg': 'Invalid Route Id'}
        if curr_user.role == RoleEnum.SCHOOL_STAFF:
            ids = [mschool.id for mschool in curr_user.managed_schools]
            if route.school_id not in ids:
                return {'success': False, "msg":"Invalid User Permissions"}
        if 'students' in content:
            students = content.get('students',[])
            if type(students) is not list or not all(isinstance(x, int) for x in students):
                return {'success': False, "msg": "Invalid Query Syntax"}
            curr_students = Student.query.filter_by(route_id=route.id)
            for student in curr_students:
                student.route_id = None
            for student_num in students:
                student = Student.query.filter_by(id=student_num).first()
                if student:
                    student.route_id = route.id
        if 'name' in content:
            name = content.get('name', None)
            if type(name) is not str:
                return {'success': False, "msg": "Invalid Name"}
            route.name = name
        if 'description' in content:
            description = content.get('description', None)
            if type(description) is not str:
                return {'success': False, "msg": "Invalid Description"}
            route.description = description
        if 'stops' in content:
            stops = content.get('stops', [])
            if type(stops) is not list:
                return {'success': False, "msg": "Invalid Stops"}
            school = route.school
            
            #DELETE ALL EXISTING STOPS
            existing_stops = Stop.query.filter_by(route_id=route_uid)
            for stop in existing_stops:
                db.session.delete(stop)
            
            #REPLACE WITH NEW STOPS
            sorted_stops = sorted(stops, key=lambda x: x['index'])
            dropoff_times, pickup_times = get_time_and_dist(sorted_stops, school.departure_time, school.arrival_time, school.latitude, school.longitude)
            for f in range(len(stops)):
                stop_info = sorted_stops[f]
                new_stop = Stop(name=stop_info['name'], route_id=route_uid, latitude=stop_info['latitude'], longitude=stop_info['longitude'], index=stop_info['index'], pickup_time=pickup_times[f], dropoff_time=dropoff_times[f])
                db.session.add(new_stop)   
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Erorr Committing Stops"}
        return {'success': True}
    return {'success': False}

@app.route('/bus/<bus_uid>', methods = ['OPTIONS'])
@app.route('/bus', methods = ['OPTIONS'])
@cross_origin()
def bus_options(route_uid=None):
    return {'success':True}

@app.route('/bus', methods = ['POST'])
@app.route('/bus/<bus_uid>', methods = ['DELETE'])
@cross_origin()
@admin_required(roles=[RoleEnum.DRIVER])
def bus_post(bus_uid=None):
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    if request.method == 'DELETE':
        bus = Bus.query.filter_by(id=bus_uid).first()
        if bus is None:
            return {'success': False, 'msg': 'Invalid Bus Id'}
        try:
            duration = datetime.now() - bus.start_time
            bus.log.duration = int(duration.total_seconds())
            db.session.delete(bus)
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, "msg": "Database Error"}
        return {'success': True}

    if request.method == 'POST':
        content = request.json
        number = content.get('number', None)
        route_id = content.get('route_id', None)
        direction = content.get('direction', None)
        ignore_error = content.get('ignore_error', False)

        if number is None or route_id is None or direction is None:
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(number) is not int or type(route_id) is not int or type(direction) is not int:
            return {'success': False, "msg": "Invalid Query Syntax"}

        route = Route.query.filter_by(id=route_id).first()
        if route is None:
            return {'success': False, "msg": "Invalid Route"}


        if route.bus is not None:
            if ignore_error:
                duration = datetime.now() - route.bus.start_time
                route.bus.log.duration = int(duration.total_seconds())
                db.session.delete(route.bus)
                db.session.flush()
                db.session.refresh(route)
            else:    
                return {'success': False, "msg": "Route already has other bus", "error": True}
        
        if curr_user.bus is not None:
            if ignore_error:
                duration = datetime.now() - curr_user.bus.start_time
                curr_user.bus.log.duration = int(duration.total_seconds())
                db.session.delete(curr_user.bus)
                db.session.flush()
                db.session.refresh(curr_user)
            else:    
                return {'success': False, "msg": "Driver already has other bus", "error": True}
        
        bus = Bus.query.filter_by(number=number).first()
        if bus is not None:
            if ignore_error:
                duration = datetime.now() - bus.start_time
                bus.log.duration = int(duration.total_seconds())
                db.session.delete(bus)
                db.session.flush()
            else:    
                return {'success': False, "msg": "Bus already has other run", "error": True}
        
        start_time = datetime.now()
        new_log = Log(number=number, start_time=start_time, direction=direction, user_id=curr_user.id, route_id=route_id, school_id=route.school_id)
        try:
            db.session.add(new_log)
            db.session.flush()
            db.session.refresh(new_log)
        except SQLAlchemyError:
            return {"success": False, "msg": "Database Error"}
        new_bus = Bus(number = number, start_time=start_time, route_id = route_id, user_id=curr_user.id, direction=direction, log_id = new_log.id)

        try:
            db.session.add(new_bus)
            db.session.flush()
            db.session.refresh(new_bus)
            db.session.commit()
        except SQLAlchemyError:
            return {"success": False, "msg": "Database Error"}
        return {'success': True, 'id': new_bus.id}

    return {'success': False}

@app.route('/bus', methods = ['GET'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF, RoleEnum.DRIVER])
def get_log():
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user

    args = request.args
    school_id = args.get('school_id', None, type=int)
    route_id = args.get('route_id', None, type=int)
    user_id = args.get('user_id', None, type=int)
    number = args.get('number', None, type=int)
    page = args.get('page', None,type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', 'asc')

    base_query = Log.query
    record_num = None

    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = set()
        for school in curr_user.managed_schools:
            for log in school.logs:
                ids.add(log.id)
        base_query = Log.query.filter(Log.id.in_(ids))

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        log_filt = LogFilter(data={'school_id': school_id, 'route_id': route_id, 'user_id': user_id, 'number': number, 'order_by': sort, 'page': page}, query=base_query).paginate()
        logs = log_filt.get_objects()
        record_num = log_filt.count
    else:
        log_filt = LogFilter(data={'school_id': school_id, 'route_id': route_id, 'user_id': user_id, 'number': number, 'order_by': sort}, query=base_query)
        logs = log_filt.apply()
        record_num = logs.count()

    all_logs = [log.as_dict() for log in logs]
    return {'success':True, "logs": all_logs, "records": record_num}
    

@app.route('/email/route/<uid>', methods = ['OPTIONS'])
@app.route('/email/school/<uid>', methods = ['OPTIONS'])
@app.route('/email/system', methods = ['OPTIONS'])
@cross_origin()
def email_options(uid=None):
    return {'success':True}

@app.route('/email/system', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN])
def send_email_system():
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user

    content = request.json
    email_type = content.get("email_type", None)
    subject = content.get("subject", None)
    body = content.get("body", None)

    if not email_type or not subject or not body:
        return {'success': False, "msg": "Invalid Query Syntax"}

    if email_type not in ["general", "route"] or type(subject) is not str or type(body) is not str:
        return {'success': False, "msg": "Invalid Query Syntax"}

    users = User.query.filter_by(role=RoleEnum.UNPRIVILEGED).all()
    for user in users:
        student_txt = ""
        if '@example.com' in user.login.email:
            continue
        if email_type == 'route':
            for student in user.children:
                route_txt = "Route: No route - see admin\n"
                if student.route is not None:
                    route_txt = (
                        f"Route Name: {student.route.name}\n"
                        f"Route Description: \n"
                        f"{student.route.description} \n"
                    )
                    stops = student.route.stops
                    in_range_stops = []
                    for stop in stops:
                        if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                            in_range_stops.append(stop)
                    if len(in_range_stops) == 0:
                        route_txt += "Stops: None in range\n"
                    else:
                        route_txt += "\nPossible Stops: \n"
                        for stop in in_range_stops:
                            route_txt += (
                                f"\n"
                                f"\tStop Name: {stop.name}\n"
                                f"\tPickup Time: {stop.pickup_time}\n"
                                f"\tDropoff Time: {stop.dropoff_time}\n"
                            )
                student_txt += (
                    "\n"
                    f"Student Name: {student.name}\n"
                    f"Student ID: {student.student_id if student.student_id is not None else 'No Student ID'}\n"
                    f"School Name: {student.school.name}\n"
                    f"{route_txt}"
                    "\n"
                )
        r = requests.post(
        f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
        auth=("api", API_KEY),
        data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
            "to": user.login.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {'success': False, "msg": "Internal Server Error"}
    return {'success': True}


@app.route('/email/school/<school_uid>', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def send_email_school(school_uid=None):
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user
    school = School.query.filter_by(id=school_uid).first()
    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = [mschool.id for mschool in curr_user.managed_schools]
        if school.id not in ids:
            return {'success': False, "msg":"Invalid User Permissions"}

    content = request.json
    email_type = content.get("email_type", None)
    subject = content.get("subject", None)
    body = content.get("body", None)

    if not email_type or not subject or not body:
        return {'success': False, "msg": "Invalid Query Syntax"}

    if email_type not in ["general", "route"] or type(subject) is not str or type(body) is not str:
        return {'success': False, "msg": "Invalid Query Syntax"}

    all_students = Student.query.filter_by(school_id=school_uid)
    user_ids = set()
    for student in all_students:
        user_ids.add(student.user_id)
    for user_id in user_ids:
        student_txt = ""
        user = User.query.filter_by(id=user_id).first()
        if '@example.com' in user.login.email:
            continue
        if email_type == 'route':
            for student in user.children:
                route_txt = "Route: No route - see admin\n"
                if student.route is not None:
                    route_txt = (
                        f"Route Name: {student.route.name}\n"
                        f"Route Description: \n"
                        f"{student.route.description} \n"
                    )
                    stops = student.route.stops
                    in_range_stops = []
                    for stop in stops:
                        if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                            in_range_stops.append(stop)
                    if len(in_range_stops) == 0:
                        route_txt += "Stops: None in range\n"
                    else:
                        route_txt += "\nPossible Stops: \n"
                        for stop in in_range_stops:
                            route_txt += (
                                f"\n"
                                f"\tStop Name: {stop.name}\n"
                                f"\tPickup Time: {stop.pickup_time}\n"
                                f"\tDropoff Time: {stop.dropoff_time}\n"
                            )
                student_txt += (
                    "\n"
                    f"Student Name: {student.name}\n"
                    f"Student ID: {student.student_id if student.student_id is not None else 'No Student ID'}\n"
                    f"School Name: {student.school.name}\n"
                    f"{route_txt}"
                    "\n"
                )
        r = requests.post(
        f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
        auth=("api", API_KEY),
        data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
            "to": user.login.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {"success": False}
    return {'success': True}
    


@app.route('/email/route/<route_uid>', methods = ['POST'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def send_email_route(route_uid=None):
    # curr_user = User.query.filter_by(email = get_jwt_identity()).first()
    login = Login.query.filter_by(email = get_jwt_identity()).first()
    curr_user = login.user

    route = Route.query.filter_by(id=route_uid).first()
    if curr_user.role == RoleEnum.SCHOOL_STAFF:
        ids = [mschool.id for mschool in curr_user.managed_schools]
        if route.school_id not in ids:
            return {'success': False, "msg":"Invalid User Permissions"}

    content = request.json
    email_type = content.get("email_type", None)
    subject = content.get("subject", None)
    body = content.get("body", None)

    if not email_type or not subject or not body:
        return {'success': False, "msg": "Invalid Query Syntax"}

    if email_type not in ["general", "route"] or type(subject) is not str or type(body) is not str:
        return {'success': False, "msg": "Invalid Query Syntax"}

    all_students = Student.query.filter_by(route_id=route_uid)
    user_ids = set()
    for student in all_students:
        user_ids.add(student.user_id)
    for user_id in user_ids:
        student_txt = ""
        user = User.query.filter_by(id=user_id).first()
        if '@example.com' in user.login.email:
            continue
        if email_type == 'route':
            for student in user.children:
                route_txt = "Route: No route - see admin\n"
                if student.route is not None:
                    route_txt = (
                        f"Route Name: {student.route.name}\n"
                        f"Route Description: \n"
                        f"{student.route.description} \n"
                    )
                    stops = student.route.stops
                    in_range_stops = []
                    for stop in stops:
                        if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                            in_range_stops.append(stop)
                    if len(in_range_stops) == 0:
                        route_txt += "Stops: None in range\n"
                    else:
                        route_txt += "\nPossible Stops: \n"
                        for stop in in_range_stops:
                            route_txt += (
                                f"\n"
                                f"\tStop Name: {stop.name}\n"
                                f"\tPickup Time: {stop.pickup_time}\n"
                                f"\tDropoff Time: {stop.dropoff_time}\n"
                            )
                student_txt += (
                    "\n"
                    f"Student Name: {student.name}\n"
                    f"Student ID: {student.student_id if student.student_id is not None else 'No Student ID'}\n"
                    f"School Name: {student.school.name}\n"
                    f"{route_txt}"
                    "\n"
                )
        r = requests.post(
        f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
        auth=("api", API_KEY),
        data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
            "to": user.login.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {"success": False}
    return {'success': True}

@app.route('/fileValidation', methods = ['POST', 'OPTIONS'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def validateFiles():
    if request.method == 'OPTIONS':
        return {'success': True}

    target='/uploadFiles/'
    logging.debug(os.getcwd())
    if not os.path.isdir(target):
        os.mkdir(target)
    
    response = {}
    user_rows = []

    for filename, file in request.files.items():
        #ADD SOMETHING TO CHECK USERS.CSV first
        if filename == 'users.csv':
            csvreader_user = get_csv(file)
            user_rows, user_resp, critical = validate_users(csvreader_user)
            logging.info(user_resp)
            response['users'] = user_resp[1:]
        if filename == 'students.csv':
            csvreader_student = get_csv(file)
            stud_rows, stud_resp, critical = validate_students(csvreader_student, user_rows)
            response['students'] = stud_resp[1:]
    # userFile = request.files.get('parents.csv')
    # userFile = request.form.get('parents.csv')
    # content = request.json
    # userFile = content.get('parents.csv')
    # logging.debug(userFile)

    # studentFile = request.files.get('students.csv')
    # text_stream = TextIOWrapper(userFile.stream, encoding='cp932')
    # for row in csv.reader(text_stream):
    #     logging.debug(text_stream)

    # df = pd.read_csv(StringIO(userFile))
    # logging.debug(userFile)
    response['success'] = True
    return json.dumps(response)


@app.route('/validaterecords', methods=['POST', 'OPTIONS'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def validate():
    if request.method == 'OPTIONS':
        return {'success': True}

    response = {}
    content = request.json
    no_errors = True
    if 'users' in content:
        users = content.get('users')
        users, user_resp, critical = validate_users(users)
        logging.debug(user_resp)
        if critical:
            no_errors = False

    if 'students' in content:
        students = content.get('students')
        students, student_resp, critical = validate_students(students, users)
        if critical:
            no_errors = False
    
    if no_errors is False:
        response['users'] = user_resp
        response['students'] = student_resp
        response['valid'] = False
        response['success'] = True
        return json.dumps(response)
    
    else:
        #LOOP THROUGH ALL VALUES AND ADD OBJECTS TO DB
        response['success'] = True
        response['valid'] = True
        response['users'] = user_resp
        response['students'] = student_resp
        return json.dumps(response)
    


@app.route('/bulkimport', methods=['POST', 'OPTIONS'])
@cross_origin()
@admin_required(roles=[RoleEnum.ADMIN, RoleEnum.SCHOOL_STAFF])
def bulkImport():

    if request.method == 'OPTIONS':
        return {'success': True}
    response = {}
    content = request.json
    no_errors = True
    if 'users' in content:
        users = content.get('users')
        users, user_resp, critical = validate_users(users)
        if critical:
            no_errors = False
    if 'students' in content:
        students = content.get('students')
        students, student_resp, critical = validate_students(students, users)
        if critical:
            no_errors = False
    
    if no_errors is False:
        response['users'] = user_resp
        response['students'] = student_resp
        response['valid'] = False
        response['success'] = True
        return json.dumps(response)
    
    else:
        #LOOP THROUGH ALL VALUES AND ADD OBJECTS TO DB
        for user in users:
            lat, lng = geocode_address(user[2])
            if '@example.com' in user[0]:
                password = "ParentPassword2@22"
                encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            new_login = Login(email=user[0])
            db.session.add(new_login)
            db.session.flush()
            db.session.refresh(new_login)
            new_login.pswd=encrypted_pswd.decode('utf-8')
            new_user = User(full_name=user[1], uaddress = user[2], role=RoleEnum.UNPRIVILEGED, latitude=lat, longitude=lng, phone=user[3],login_id=new_login.id)
            db.session.add(new_user)
            db.session.flush()
            db.session.refresh(new_user)
            if '@example.com' not in user[0]:
                access_token = create_access_token(identity=user[0])
                link = f"{DOMAIN}/resetpassword?token={access_token}"
    
                r = requests.post(
                f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
                auth=("api", API_KEY),
                data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
                    "to": user[0],
                    "subject": "Account Creation for Hypothetical Transportation",
                    "html": f"Please use the following link to set the password for your new account: \n <a href={link}>{link}</a>"})
            

        for student in students:
            associated_school = School.query.filter(func.lower(School.name) == func.lower(student[3].strip())).first()
            login = Login.query.filter(func.lower(Login.email) == func.lower(student[1].strip())).first()
            associated_parent = login.user
            
            new_student = Student(name=student[0], school_id=associated_school.id, user_id=associated_parent.id)
            if student[2] != '':
                new_student.student_id = int(student[2])
            db.session.add(new_student)
        
        db.session.commit()

        #CREATE RESPONSE
        response['success'] = True
        response['valid'] = True
        response['users'] = len(users)
        response['students'] = len(students)
        return json.dumps(response)



#HELPER METHODS

def validate_users(csvreader_user):
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    user_resp = []
    user_rows = []
    usr_row_ct = 0
    critical = False

    emails = {}
    names = {}
    for row in csvreader_user:
        #SHOULD HAVE email, name, address, phone number
        errors = {}

        if type(row) is list:
            if usr_row_ct == 0:
                if(row[0]!='email' or row[1]!='name' or row[2] != 'address' or row[3]!='phone_number'):
                    return [], [], True
                user_rows.append(row)
                user_resp.append({'row': row, 'errors': errors})
                usr_row_ct +=1
                continue
            
            if len(row) != 4:
                errors['format'] = "Missing values"
                critical = True
            
            email, name, addr, phone_number = row
        
        if type(row) is dict:
            if len(row) != 5:
                errors['format'] = "Missing values"
                critical = True
            email = row.get('email', "")
            name = row.get("name", "")
            addr = row.get('address', "")
            phone_number = row.get('phone', "")
            row = [email, name, addr, phone_number]
        
        logging.debug(email)
        #CHECK FOR DUPLICATES
        # dup_email = User.query.filter(func.lower(User.email) == func.lower(email)).first()
        dup_email = Login.query.filter(func.lower(Login.email) == func.lower(email)).first()
        if dup_email:
            if dup_email.user is not None:
                errors['dup_email'] = f"Duplicate existing email found, duplicate user name is {dup_email.user.full_name}, address is {dup_email.user.uaddress}, phone is {dup_email.user.phone} | "
            critical = True
        dup_name = User.query.filter(func.lower(User.full_name) == func.lower(name)).first()
        if dup_name:
            errors['dup_name'] = f"Duplicate existing name found, duplicate user email is {dup_name.login.email}, address is {dup_name.uaddress}, phone is {dup_name.phone} | "

        #CHECK DATA TYPES etc.
        if name == "":
            errors['name'] = "Record must have name"
            critical = True
        
        if len(name.split(" ")) < 2:
            errors['name'] = "Record should have both a first and last name"

        if name.strip().lower() in names:
            error_msg = ""
            for ind in names[name.strip().lower()]:
                urw = user_rows[ind]
                error_msg += f"Duplicate name record found, duplicate user email is {urw[0]}, address is {urw[2]}, phone is {urw[3]} | "
                if 'dup_name' not in user_resp[ind]['errors']:
                    user_resp[ind]['errors']['dup_name'] = ''
                user_resp[ind]['errors']['dup_name'] += f"Duplicate name record found, duplicate user email is {email}, address is {addr}, phone is {phone_number} | "
            if 'dup_name' not in errors:
                errors['dup_name'] = ''
            errors['dup_name'] += error_msg
        else:
            names[name.strip().lower()] = []
        
        names[name.strip().lower()].append(usr_row_ct)

        if email == "":
            errors['email'] = "Record must have an email"
            critical = True
        
        if email.strip().lower() in emails:
            error_msg = ""
            for ind in emails[email.strip().lower()]:
                urw = user_rows[ind]
                error_msg += f"Duplicate email record found, duplicate user name is {urw[1]}, address is {urw[2]}, phone is {urw[3]} | "
                if 'dup_email' not in user_resp[ind]['errors']:
                    user_resp[ind]['errors']['dup_email'] = ''
                user_resp[ind]['errors']['dup_email'] += f"Duplicate email record found, duplicate user name is {name}, address is {addr}, phone is {phone_number} | "
            if 'dup_email' not in errors:
                errors['dup_email'] = ''
            errors['dup_email'] += error_msg
            critical = True
        else:
            emails[email.strip().lower()] = []
        
        emails[email.strip().lower()].append(usr_row_ct)

        if addr == "":
            errors['address'] = "Record must have an address"
            critical = True
        
        if phone_number == "":
            errors['phone'] = "Record must have a phone number"
            critical = True

        if(not re.fullmatch(regex,email)):
            errors['email'] = 'Invalid email format'
            critical = True
        
        if addr != "":
            lat_lng = geocode_address(addr)
            if not lat_lng:
                errors['address'] = 'Invalid address format'
                critical = True
        user_rows.append(row)
        user_resp.append({'row': row, 'errors': errors})
        logging.debug(row)
        usr_row_ct +=1    
    return user_rows, user_resp, critical

def validate_students(csvreader_student, user_rows):
    student_rows = []
    stud_resp = []
    stud_row_ct = 0
    critical = False
    names = {}
    for row in csvreader_student:
        #SHOULD HAVE name, parent_email, student_id, school_name
        errors = {}

        if type(row) is list:
        
            if stud_row_ct == 0:
                if(row[0]!='name' or row[1]!='parent_email' or row[2] != 'student_id' or row[3]!='school_name'):
                    return [], [], True
                student_rows.append(row)
                stud_resp.append({'row': row, 'errors': errors})
                stud_row_ct +=1
                continue
            
            if len(row) != 4:
                errors['format'] = "Missing values"
                critical = True

            name, email, student_id, school_name = row
        
        if type(row) is dict:
            if len(row) != 5:
                errors['format'] = "Missing values"
            name = row.get('name', "")
            email = row.get("parentemail", "")
            student_id = row.get('studentid', "")
            school_name = row.get('school', "")
            row = [name, email, student_id, school_name]

        school_name = school_name.strip()
        email = email.strip()

        #CHECK FOR DUPLICATES in file?
        name = name.strip()
        dup_name = Student.query.filter(func.lower(Student.name) == func.lower(name)).first()
        if dup_name:
            errors['dup_name'] = f"Duplicate existing name found, duplicate student parent is {dup_name.user.email}, school is {dup_name.school.name}, id is {dup_name.student_id} | "
        

        #CHECK DATA TYPES etc.
        if name == "":
            errors['name'] = "Record must have name"
            critical = True
        if len(name.split(" ")) < 2:
            errors['name'] = "Record should have both a first and last name"
        
        if name.strip().lower() in names:
            error_msg = ""
            for ind in names[name.strip().lower()]:
                urw = student_rows[ind]
                error_msg += f"Duplicate name record found, duplicate student parent is {urw[1]}, school is {urw[3]}, id is {urw[2]} | "
                if 'dup_name' not in stud_resp[ind]['errors']:
                    stud_resp[ind]['errors']['dup_name'] = ''
                stud_resp[ind]['errors']['dup_name'] += f"Duplicate name record found, duplicate student parent is {email}, school is {school_name}, id is {student_id} | "
            if 'dup_name' not in errors:
                errors['dup_name'] = ''
            errors['dup_name'] += error_msg
        else:
            names[name.strip().lower()] = []
        
        names[name.strip().lower()].append(stud_row_ct)

        if student_id != "":
            #ADD CHECK for floats and strings
            try:
                student_id = int(student_id)
                if student_id <=0 or student_id > 2147483647:
                    errors['studentid'] = "ID cannot be negative or out of range"
                    critical = True
            except ValueError:
                errors['studentid'] = "ID is not valid integer"
                critical = True
            # errors['student_id'] = "Record must have a numeric ID if provided"
        
        if school_name == "":
            errors['school'] = "Record must have a school"
            critical = True
        else:
            # curr_user = User.query.filter_by(email = get_jwt_identity()).first() 
            login = Login.query.filter_by(email = get_jwt_identity()).first()
            curr_user = login.user               
            existing_school = School.query.filter(func.lower(School.name) == func.lower(school_name)).first()
            if existing_school is None:
                errors['school'] = 'Student record must match an existing school'
                critical = True
            elif curr_user.role == RoleEnum.SCHOOL_STAFF:
                ids = [mschool.id for mschool in curr_user.managed_schools]
                if existing_school.id not in ids:
                    errors['school'] = 'School staff does not manage school'
                    critical = True
        
        if email == "":
            errors['parentemail'] = "Record must have an associated user email"
            critical = True
        else:
            # existing_parent = User.query.filter(func.lower(User.email) == func.lower(email)).first()
            login = Login.query.filter(func.lower(Login.email) == func.lower(email)).first()
            if login:
                existing_parent = login.user
                imported_user = False                    
            if login is None:
                if len(user_rows) > 0:
                    for usr_row in user_rows:
                        if type(usr_row) is list:
                            if usr_row[0].strip().lower() == email.lower():
                                imported_user = True
                        if type(usr_row) is dict:
                            if usr_row['email'].strip().lower() == email.lower():
                                imported_user = True
        
                if imported_user is False:
                    errors['parentemail'] = 'Student record must match a valid user'
                    critical = True
        stud_resp.append({'row': row, 'errors': errors})
        student_rows.append(row)
        stud_row_ct +=1
    logging.debug(stud_resp)
    return student_rows, stud_resp, critical

def get_distance(lat1, long1, lat2, long2):
    coords_1 = (lat1, long1)
    coords_2 = (lat2, long2)
    return geopy.distance.geodesic(coords_1, coords_2).miles 

def check_complete(students, stops):
    incomplete = students.copy()
    logging.debug(incomplete)
    logging.debug(stops)
    for stop in stops:
        if 'latitude' not in stop or 'longitude' not in stop:
            logging.debug('no latitude or longitude')
            raise Exception("invalid query")
        stop_lat = stop['latitude']
        stop_long = stop['longitude']
        found = []
        for stud_id in incomplete:
            student = Student.query.filter_by(id=stud_id).first()
            if student is None:
                logging.debug('Not valid student')
                raise Exception("invalid student id")
            user = User.query.filter_by(id = student.user_id).first()
            if user is None:
                logging.debug('Not valid user')
                raise Exception('Invalid user associated with student')
            stud_lat = user.latitude
            stud_long = user.longitude
            if get_distance(stop_lat, stop_long, stud_lat, stud_long) < 0.3:
                found.append(stud_id)
        incomplete = [id for id in incomplete if id not in found]
    if len(incomplete)>0:
        return False
    return True


def get_time_and_dist(stops, departure_time, arrival_time, school_lat, school_long):
    pickup_times = []
    dropoff_times = []
    times = []
    origins = []
    destinations = []
    if len(stops)>0:
        origins.append(str(school_lat) + ' ' + str(school_long))
        destinations.append(str(stops[0]['latitude']) + ' ' +  str(stops[0]['longitude']))
        matrix = gmaps_key.distance_matrix(origins, destinations)
        times.append(matrix['rows'][0]['elements'][0]['duration']['value'])
        for f in range(len(stops)-1):
            origins = []
            destinations = []
            stop = stops[f]
            next_stop = stops[f+1]
            origins.append(str(stop['latitude']) + ' ' + str(stop['longitude']))
            destinations.append(str(next_stop['latitude']) + ' ' +  str(next_stop['longitude']))
            matrix = gmaps_key.distance_matrix(origins, destinations)
            times.append(matrix['rows'][0]['elements'][0]['duration']['value'])
        #Creates a list of times in seconds that represent travel duration for each pair of locations
        logging.debug(times)
        current_time = datetime.combine(date.today(),departure_time)
        current_pickup = datetime.combine(date.today(),arrival_time)
        
        for time in times:
            current_time = current_time + timedelta(seconds=time)
            current_pickup = current_pickup - timedelta(seconds=time)
            dropoff_times.append(current_time.time())
            pickup_times.append(current_pickup.time())
        logging.debug(dropoff_times)
        logging.debug(pickup_times)
        return dropoff_times, pickup_times
    else:
        return [],[]


def update_stop_calculations(school):
    routes = Route.query.filter_by(school_id = school.id)
    for route in routes:
        stops = Stop.query.filter_by(route_id=route.id)
        stop_dicts = [stop.as_dict() for stop in stops]
        sorted_stops = sorted(stop_dicts, key=lambda x: x['index'])
        dropoff_times, pickup_times = get_time_and_dist(sorted_stops, school.departure_time, school.arrival_time, school.latitude, school.longitude)
        for f in range(len(sorted_stops)):
            stop_info = sorted_stops[f]
            stop_to_edit = Stop.query.filter_by(id=stop_info['id']).first()
            stop_to_edit.pickup_time = pickup_times[f]
            stop_to_edit.dropoff_time = dropoff_times[f]
    db.session.commit()

def get_csv(file):
    target='/uploadFiles/'
    filename = secure_filename(file.filename)
    logging.debug(filename)
    file.save("/".join([target, filename]))
    csvreader = csv.reader(open("/".join([target, filename])))
    return csvreader

def geocode_address(addr):
    g = gmaps_key.geocode(addr)
    logging.debug(g)
    if len(g) == 0:
        return False
    lat = g[0]["geometry"]["location"]["lat"]
    lng = g[0]["geometry"]["location"]["lng"]
    return lat, lng

    
def remove_buses():
    buses = Bus.query.all()
    for bus in buses:
        if bus.start_time + timedelta(minutes=180) < datetime.now():
            logging.info(f"Kill bus {bus.number} {datetime.now()}")
            duration = datetime.now() - bus.start_time
            bus.log.duration = int(duration.total_seconds())
            db.session.delete(bus)
            db.session.commit()


app.register_blueprint(api, url_prefix='/api')

scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(remove_buses, trigger='interval', seconds=180)
scheduler.start()

if __name__ == "__main__":
    app.run(debug=True)
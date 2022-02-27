from flask import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Query
from sqlalchemy.exc import SQLAlchemyError
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

from models import User, Student, School, Route, Stop, UserFilter, StudentFilter, SchoolFilter, RouteFilter, TokenBlocklist

db.create_all()

jwt = JWTManager(app)
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

YOUR_DOMAIN_NAME="mail.hypotheticaltransportfive.email"
API_KEY = open('email_api.key', 'r').read().strip().replace('\n', '')

DOMAIN = os.getenv("DOMAIN", "https://hypotheticaltransportfive.colab.duke.edu")

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
    return token is not None

# custom decorator 
def admin_required():
    def cust_wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user = User.query.filter_by(email = get_jwt_identity()).first()
            if user.admin_flag:
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
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {'success': False, 'msg': 'Invalid User ID'}
    return {'success': True, 'user': user.as_dict()}

@app.route("/current_user/<student_id>", methods = ['GET'])
@jwt_required()
@cross_origin()
def get_current_user_student(student_id=None):
    if student_id is None:
        return {'success': False, "msg": "Invalid Query Syntax"}
    verify_jwt_in_request()
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {'success': False, "msg": "Invalid User ID"}
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
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {'success': False, "msg": "Invalid User ID"}
    content = request.json
    if 'password' in content:
        pswd = content.get('password', None)
        if type(pswd) is not str:
            return {'success': False, "msg": "Invalid Query Syntax"}
        encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
        user.pswd = encrypted_pswd.decode('utf-8')
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
    user = User.query.filter_by(email=email).first()
    if not user:
        return {"success": False, "msg": "There is no account associated with that email"}
    if user.pswd is None:
        return {"success": False, "msg": "Password has not been set"} 
    if not bcrypt.checkpw(password.encode('utf-8'), user.pswd.encode('utf-8')):
        return {"success": False, "msg": "Invalid password"}
    access_token = create_access_token(identity=email)
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
    user = User.query.filter_by(email=email).first()
    if not user:
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
@admin_required()
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

@app.route('/user/<user_id>', methods = ['OPTIONS'])
@app.route('/user', methods = ['OPTIONS'])
@cross_origin()
def user_options(username=None):
    return {'success':True}

@app.route('/user/<user_id>', methods = ['GET'])
@app.route('/user', methods = ['GET'])
@cross_origin()
@admin_required()
def users_get(user_id=None):

    if user_id is not None:
        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success': False, "msg": "Invalid User ID"}
        return {'success': True, 'user': user.as_dict()}

    args = request.args
    name_search = args.get('name', '')
    email_search = args.get('email', '')
    sort = args.get('sort', None)
    direction = args.get('dir', None)
    page = args.get('page', None, type=int)
    base_query = User.query
    record_num = None

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        user_filt = UserFilter(data={'full_name': name_search, 'email': email_search, 'order_by': sort, 'page': page}).paginate()
        base_query = user_filt.get_objects()
        record_num = user_filt.count
    else:
        user_filt = UserFilter(data={'full_name': name_search, 'email': email_search, 'order_by': sort})
        base_query = user_filt.apply()
        record_num = base_query.count()

    users = base_query

    all_users = []
    for user in users:
        all_users.append(user.as_dict())
    return {'success': True, "users": all_users, "records": record_num}


@app.route('/user/<user_id>', methods = ['PATCH','DELETE'])
@app.route('/user', methods = ['POST'])
@cross_origin()
@admin_required()
def users(user_id=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success':False, 'msg': 'Invalid Email'}
        students = Student.query.filter_by(user_id = user_id)
        for student in students:
            db.session.delete(student)
        try:
            db.session.delete(user)
            db.session.commit()
        except SQLAlchemyError:
            return {'success': False, 'msg': 'Database Error'}
        return {'success': True}
    
    if request.method == 'POST':
        content = request.json
        email = content.get('email', None)
        name = content.get('name', None)
        admin_flag = content.get('admin_flag', None)
        address = content.get('address', None)
        longitude = content.get('longitude', None)
        latitude = content.get('latitude', None)

        if not email or not name or not address or not longitude or not latitude or admin_flag is None:
            logging.debug('MISSING A FIELD')
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(email) is not str or type(name) is not str or type(admin_flag) is not bool or type(address) is not str or type(latitude) is not float or type(longitude) is not float:
            logging.debug('WRONG FIELD TYPE')
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        user = User.query.filter_by(email=email).first()
        if user:
            return {'success': False, 'msg': 'User with this email exists'}

        new_user = User(email=email, full_name=name, uaddress=address, admin_flag=admin_flag, latitude=latitude, longitude=longitude)
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
    
        if 'email' in content:
            email = content.get('email', None)
            if type(email) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            email_user = User.query.filter_by(email=email).first()
            if email_user and email_user.id != int(user_id):
                return {'success': False, "msg": "Account already exists with this email"}
            user.email = email
        if 'name' in content:
            full_name = content.get('name', None)
            if type(full_name) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.full_name = full_name
        if 'address' in content:
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
        if 'admin_flag' in content:
            admin_flag = content.get('admin_flag', None)
            if type(admin_flag) is not bool:
                return {'success': False, "msg": "Invalid Query Syntax"}
            user.admin_flag = admin_flag
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
@admin_required()
def students_get(student_uid=None):

    if student_uid is not None:
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return {'success': False, 'msg': 'Invalid Student Id'}
        return {'success': True, 'student': student.as_dict()}

    args = request.args
    name_search = args.get('name', '')
    id_search = args.get('id', None, type=int)
    page = args.get('page', None, type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', None)
    base_query = Student.query
    record_num = None

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        student_filt = StudentFilter(data={'name': name_search, 'student_id': id_search, 'order_by': sort, 'page': page}).paginate()
        base_query = student_filt.get_objects()
        record_num = student_filt.count
    else:
        student_filt = StudentFilter(data={'name': name_search, 'student_id': id_search, 'order_by': sort})
        base_query = student_filt.apply()
        record_num = base_query.count()

    students = [student.as_dict() for student in base_query]
    return {'success':True, "students": students, "records": record_num}

@app.route('/student/<student_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/student', methods = ['POST'])
@cross_origin()
@admin_required()
def students(student_uid = None):
    if request.method == 'DELETE':
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return {'sucess': False, 'msg': 'Invalid Student Id'}
        db.session.delete(student)
        db.session.commit()
        return {'success': True}
    
    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)
        user_id = content.get('user_id', None)

        if not name or not school_id or not user_id:
            return {'success': False, "msg": "Invalid Query Syntax"}
        
        if type(name) is not str or type(school_id) is not int or type(user_id) is not int:
            return {'success': False, "msg": "Invalid Query Syntax"}

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return {'success': False, 'msg': 'Student doesn\'t belong to a user'}
        if user.uaddress is None:
            return {'success': False, 'msg': 'User must have an address to create a student'}

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
            student.user_id = user_id
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
@admin_required()
def schools_get(school_uid=None):

    if school_uid is not None:
        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return {'success': False, 'msg': 'Invalid School Id'}
        return {'success': True, 'school': school.as_dict()}

    args = request.args
    name_search = args.get("name", '')
    page = args.get('page',None,type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', 'asc')
    base_query = School.query
    record_num = None

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        school_filt = SchoolFilter(data={'name': name_search, 'order_by': sort, 'page': page}).paginate()
        base_query = school_filt.get_objects()
        record_num = school_filt.count
    else:
        school_filt  = SchoolFilter(data={'name': name_search, 'order_by': sort})
        base_query = school_filt.apply()
        record_num = base_query.count()

    all_schools = [school.as_dict() for school in base_query]
    return {'success':True, "schools": all_schools, "records": record_num}
     

@app.route('/school/<school_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/school', methods = ['POST'])
@admin_required()
@cross_origin()
def schools(school_uid = None):  
    if request.method == 'DELETE':
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
        if 'name' in content:
            name = content.get('name', None)
            if type(name) is not str:
                return {'success': False, "msg": "Invalid Query Syntax"}
            school.name = name
        if 'address' in content:
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
@admin_required()
def routes_get(route_uid=None):
    
    if route_uid is not None:
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return {'success': False, 'msg': 'Invalid Route Id'}
        return {'success': True, 'route': route.as_dict()}

    args = request.args
    name_search = args.get('name', '')
    page = args.get('page', None,type=int)
    sort = args.get('sort', None)
    direction = args.get('dir', 'asc')
    base_query = Route.query
    record_num = None

    if sort and direction == 'desc':
        sort = '-'+sort
    if page:
        route_filt = RouteFilter(data={'name': name_search, 'order_by': sort, 'page': page}).paginate()
        base_query = route_filt.get_objects()
        record_num = route_filt.count
    else:
        route_filt = RouteFilter(data={'name': name_search, 'order_by': sort})
        base_query = route_filt.apply()
        record_num = base_query.count()

    all_routes = [route.as_dict() for route in base_query]
    return {'success':True, "routes": all_routes, "records": record_num}


@app.route('/route/<route_uid>', methods = ['PATCH','DELETE'])
@app.route('/route', methods = ['POST'])
@cross_origin()
@admin_required()
def routes(route_uid = None):
    if request.method == 'DELETE':
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return {'success': False, 'msg': 'Invalid Route Id'}
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

@app.route('/email/route/<uid>', methods = ['OPTIONS'])
@app.route('/email/school/<uid>', methods = ['OPTIONS'])
@app.route('/email/system', methods = ['OPTIONS'])
@cross_origin()
def email_options(uid=None):
    return {'success':True}

@app.route('/email/system', methods = ['POST'])
@cross_origin()
@admin_required()
def send_email_system():
    content = request.json
    email_type = content.get("email_type", None)
    subject = content.get("subject", None)
    body = content.get("body", None)

    if not email_type or not subject or not body:
        return {'success': False, "msg": "Invalid Query Syntax"}

    if email_type not in ["general", "route"] or type(subject) is not str or type(body) is not str:
        return {'success': False, "msg": "Invalid Query Syntax"}

    users = User.query.all()
    for user in users:
        student_txt = ""
        if '@example.com' in user.email:
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
            "to": user.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {'success': False, "msg": "Internal Server Error"}
    return {'success': True}


@app.route('/email/school/<school_uid>', methods = ['POST'])
@cross_origin()
@admin_required()
def send_email_school(school_uid=None):
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
        if '@example.com' in user.email:
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
            "to": user.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {"success": False}
    return {'success': True}
    


@app.route('/email/route/<route_uid>', methods = ['POST'])
@cross_origin()
@admin_required()
def send_email_route(route_uid=None):
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
        if '@example.com' in user.email:
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
            "to": user.email,
            "subject": subject,
            "text": body + student_txt})
        if r.status_code != 200:
            logging.info(r.json())
            return {"success": False}
    return {'success': True}

#HELPER METHODS

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

app.register_blueprint(api, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)
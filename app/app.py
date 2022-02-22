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


from models import User, Student, School, Route, Stop, UserFilter, StudentFilter, SchoolFilter, RouteFilter

db.create_all()

jwt = JWTManager(app)
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')


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
    return json.dumps({'success':True})

@app.route("/current_user", methods = ['GET'])
@jwt_required()
@cross_origin()
def get_current_user():
    verify_jwt_in_request()
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {"msg": "Invalid User ID"}, 400
    students = Student.query.filter_by(user_id = user.id).all()
    all_students = []
    for student in students:
        all_students.append(student.as_dict())
    return json.dumps({'success': True, 'user': user.as_dict(), 'students': all_students})

@app.route("/current_user/<student_id>", methods = ['GET'])
@jwt_required()
@cross_origin()
def get_current_user_student(student_id=None):
    if student_id is None:
        return {"msg": "Invalid Query Syntax"}, 400
    verify_jwt_in_request()
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {"msg": "Invalid User ID"}, 400
    student = Student.query.filter_by(id=student_id).first()
    if student.user_id != user.id:
        return jsonify(msg="User not authorized to do this action"), 403
    school = School.query.filter_by(id=student.school_id).first()
    school_dict = {"id": school.id, "name": school.name, "address": school.address}
    route_dict = None
    in_range_stops = []
    if student.route_id is not None:
        route = Route.query.filter_by(id=student.route_id).first()
        stops = route.stops
        for stop in stops:
            if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                in_range_stops.append(stop.as_dict())
        route_dict = {"id": route.id, "name": route.name, "description": route.description}
    return json.dumps({'success': True, 'student': student.as_dict(), 'school': school_dict, 'route': route_dict, 'in_range_stops': in_range_stops})

@app.route("/current_user", methods = ['PATCH'])
@jwt_required()
@cross_origin()
def patch_current_user():
    verify_jwt_in_request()
    user = User.query.filter_by(email = get_jwt_identity()).first()
    if user is None:
        return {"msg": "Invalid User ID"}, 400
    content = request.json
    if 'password' in content:
        pswd = content.get('password', None)
        if type(pswd) is not str:
            return {"msg": "Invalid Query Syntax"}, 400
        encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
        user.pswd = encrypted_pswd.decode('utf-8')
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
    return json.dumps({'success': True})


@app.route('/login', methods = ['POST'])
@cross_origin()
def login():
    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if not email or not password:
        return {"msg": "Invalid Query Syntax"}, 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return {"success": False, "error": "There is no account associated with that email"}
    if not bcrypt.checkpw(password.encode('utf-8'), user.pswd.encode('utf-8')):
        return {"success": False, "error": "Invalid password"}
    access_token = create_access_token(identity=email)
    response = {"success": True, "access_token": access_token}
    return response

@app.route('/logout', methods = ['POST'])
@jwt_required()
@cross_origin()
def logout():
    response = jsonify({"msg":"logout successful"})
    unset_jwt_cookies(response)
    return response

@app.route('/distance', methods = ['POST'])
@admin_required()
@cross_origin()
def calc_distance_miles():
    long1 = request.json.get('longitude1', None)
    lat1 = request.json.get('latitude1', None)
    long2 = request.json.get('longitude2', None)
    lat2 = request.json.get('latitude2', None)

    if not long1 or not lat1 or not long2 or not lat2:
        return {"msg": "Invalid Query Syntax"}, 400

    if type(long1) is not float or type(lat1) is not float or type(long2) is not float or type(lat2) is not float:
        return {"msg": "Invalid Query Syntax"}, 400
    
    distance = get_distance(lat1, long1, lat2, long2)
    response = {"success": True, "miles": distance}
    return response

@app.route('/check_school_name/<school_name>', methods=['OPTIONS'])
@cross_origin()
def name_unq_options(school_name=None):
    return json.dumps({"success": True})


@app.route('/check_school_name/<school_name>', methods=['GET'])
@admin_required()
@cross_origin()
def check_school_name_uniqueness(school_name=None):
    if school_name is not None:
        school = School.query.filter_by(name=school_name).first()
        if school is not None:
            return {"success": True, "unique": False}
        else:
            return {"success": True, "unique": True}
    else:
        return {"msg": "Invalid Query Syntax"}, 400


@app.route('/check_complete', methods = ['OPTIONS'])
@cross_origin()
def check_comp_options():
    return json.dumps({'success':True})


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
        return {"msg": "Invalid Query Syntax"}, 400

    try:
        completion = check_complete(students, stops)
    except Exception:
        logging.debug("EXCEPTION")
        return {"msg": "Invalid Query Syntax"}, 400

    response = {"success": True, "completion": completion}
    return response

#USER CRUD

@app.route('/user/<user_id>', methods = ['OPTIONS'])
@app.route('/user', methods = ['OPTIONS'])
@cross_origin()
def user_options(username=None):
    return json.dumps({'success':True})

@app.route('/user/<user_id>', methods = ['GET'])
@app.route('/user', methods = ['GET'])
@cross_origin()
@admin_required()
def users_get(user_id=None):
    if request.method == 'GET':
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
        
        if user_id is not None:
            user = User.query.filter_by(id=user_id).first()
            if user is None:
                return {"msg": "Invalid User ID"}, 400
            students = Student.query.filter_by(user_id = user_id).all()
            all_students = []
            for student in students:
                all_students.append(student.as_dict())
            return json.dumps({'success': True, 'user': user.as_dict(), 'students': all_students})

        all_users = []
        for user in users:
            all_users.append(user.as_dict())
        return json.dumps({'success': True, "users": all_users, "records": record_num})


@app.route('/user/<user_id>', methods = ['PATCH','DELETE'])
@app.route('/user', methods = ['POST'])
@cross_origin()
@admin_required()
def users(user_id=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return json.dumps({'error': 'Invalid Email'})
        students = Student.query.filter_by(user_id = user_id)
        for student in students:
            db.session.delete(student)
        try:
            db.session.delete(user)
            db.session.commit()
        except SQLAlchemyError:
            return json.dumps({'error': 'Database Error'})
        return json.dumps({'success': True})
    
    if request.method == 'POST':
        content = request.json
        email = content.get('email', None)
        password = content.get('password', None)
        name = content.get('name', None)
        admin_flag = content.get('admin_flag', None)
        address = content.get('address', None)
        longitude = content.get('longitude', None)
        latitude = content.get('latitude', None)

        if not email or not password or not name or not address or not longitude or not latitude or admin_flag is None:
            logging.debug('MISSING A FIELD')
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(email) is not str or type(password) is not str or type(name) is not str or type(admin_flag) is not bool or type(address) is not str or type(latitude) is not float or type(longitude) is not float:
            logging.debug('WRONG FIELD TYPE')
            return {"msg": "Invalid Query Syntax"}, 400
        
        user = User.query.filter_by(email=email).first()
        if user:
            return json.dumps({'error': 'User with this email exists'})

        encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(email=email, full_name=name, uaddress=address, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'), latitude=latitude, longitude=longitude)
        try:
            db.session.add(new_user)
            db.session.flush()
            db.session.refresh(new_user)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True, 'id': new_user.id})

    if request.method == 'PATCH':
        content = request.json

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return json.dumps({'error': 'Invalid User'})
        
        else:
            if 'email' in content:
                email = content.get('email', None)
                if type(email) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                email_user = User.query.filter_by(email=email).first()
                if email_user and email_user.id != int(user_id):
                    return {"msg": "Account already exists with this email"}, 400
                user.email = email
            if 'name' in content:
                full_name = content.get('name', None)
                if type(full_name) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.full_name = full_name
            if 'address' in content:
                address = content.get('address', None)
                longitude = content.get('longitude', None)
                latitude = content.get('latitude', None)
                if not latitude or not longitude:
                    return {"msg": "Invalid Query Syntax"}, 400
                if type(address) is not str or type(longitude) is not float or type(latitude) is not float:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.uaddress = address
                user.longitude = longitude
                user.latitude = latitude
            if 'password' in content:
                pswd = content.get('password', None)
                if type(pswd) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
                user.pswd = encrypted_pswd.decode('utf-8')
            if 'admin_flag' in content:
                admin_flag = content.get('admin_flag', None)
                if type(admin_flag) is not bool:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.admin_flag = admin_flag
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})

#STUDENT CRUD

@app.route('/student/<student_uid>', methods = ['OPTIONS'])
@app.route('/student', methods = ['OPTIONS'])
@cross_origin()
def student_options(student_uid=None):
    return json.dumps({'success':True})

@app.route('/student/<student_uid>', methods = ['GET'])
@app.route('/student', methods = ['GET'])
@cross_origin()
@admin_required()
def students_get(student_uid=None):
    if request.method == 'GET':
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

        students = []
        for student in base_query:
            user = User.query.filter_by(id=student.user_id).first()
            if user is None:
                return json.dumps({'error': 'Student doesn\'t have valid User'})
            in_range=False
            route = Route.query.filter_by(id=student.route_id).first()
            if route is not None:
                stops = route.stops
                for stop in stops:
                    if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                        in_range = True
                        break
            student_dict = student.as_dict()
            student_dict['in_range'] = in_range
            students.append(student_dict)


        if student_uid is not None:
            student = Student.query.filter_by(id=student_uid).first()
            student_dict = student.as_dict()
            if student is None:
                return json.dumps({'error': 'Invalid Student Id'})
            user = User.query.filter_by(id=student.user_id).first()
            if user is None:
                return json.dumps({'error': 'Student doesn\'t have valid User'})
            in_range=False
            route = Route.query.filter_by(id=student.route_id).first()
            if route is not None:
                stops = route.stops
                for stop in stops:
                    if get_distance(stop.latitude, stop.longitude, user.latitude, user.longitude) < 0.3:
                        in_range = True
                        break
            student_dict['in_range'] = in_range
            return json.dumps({'success': True, 'student': student_dict})
        
        all_students = []
        for student in students:
            all_students.append(student)
        return json.dumps({'success':True, "students": all_students, "records": record_num})

@app.route('/student/<student_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/student', methods = ['POST'])
@cross_origin()
@admin_required()
def students(student_uid = None):
    if request.method == 'DELETE':
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return json.dumps({'error': 'Invalid Student Id'})
        db.session.delete(student)
        db.session.commit()
        return json.dumps({'success': True})
    
    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)
        user_id = content.get('user_id', None)

        if not name or not school_id or not user_id:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(school_id) is not int or type(user_id) is not int:
            return {"msg": "Invalid Query Syntax"}, 400

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return json.dumps({'error': 'Student doesn\'t belong to a user'})
        if user.uaddress is None:
            return json.dumps({'error': 'User must have an address to create a student'})

        new_student = Student(name=name, school_id=school_id, user_id=user_id)
        try:
            db.session.add(new_student)
            db.session.flush()
            db.session.refresh(new_student)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400

        if 'route_id' in content:
            route_id = content.get("route_id", None)
            if type(route_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            new_student.route_id = route_id
        if 'student_id' in content:
            student_id = content.get("student_id", None)
            if type(student_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            new_student.student_id = content['student_id']
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True, 'id': new_student.id})

    if request.method == 'PATCH':
        content = request.json
        student = Student.query.filter_by(id=student_uid).first()

        if student is None:
            return json.dumps({'error': 'Invalid Student Id'})
        if 'name' in content:
            name = content.get('name', None)
            if type(name) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            student.name = name
        if 'student_id' in content:
            student_id = content.get('student_id', None)
            if student_id is not None and type(student_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.student_id = student_id
        if 'school_id' in content:
            school_id = content.get('school_id', None)
            if type(school_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.school_id = school_id
        if 'route_id' in content:
            route_id = content.get('route_id', None)
            if route_id is not None and type(route_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.route_id = route_id
        if 'user_id' in content:
            user_id = content.get('user_id', None)
            if type(user_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.user_id = user_id
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})

#SCHOOL CRUD

@app.route('/school/<school_uid>', methods = ['OPTIONS'])
@app.route('/school', methods = ['OPTIONS'])
@cross_origin()
def schools_options(school_uid=None):
    return json.dumps({'success':True})

@app.route('/school/<school_uid>', methods = ['GET'])
@app.route('/school', methods = ['GET'])
@cross_origin()
@admin_required()
def schools_get(school_uid=None):
    if request.method == 'GET':
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

        schools = base_query

        if school_uid is not None:
            school = School.query.filter_by(id=school_uid).first()
            if school is None:
                return json.dumps({'error': 'Invalid School Id'})
            return json.dumps({'success': True, 'school': school.as_dict()})

        all_schools = []
        for school in schools:
            all_schools.append(school.as_dict())
        return json.dumps({'success':True, "schools": all_schools, "records": record_num})
     

@app.route('/school/<school_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/school', methods = ['POST'])
@admin_required()
@cross_origin()
def schools(school_uid = None):  
    if request.method == 'DELETE':
        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return json.dumps({'error': 'Invalid School Id'})
        routes = Route.query.filter_by(school_id=school.id)
        students = Student.query.filter_by(school_id=school.id)
        for route in routes:
            try:
                db.session.delete(route)
            except SQLAlchemyError:
                return {"msg": "Database Error"}, 400
        for student in students:
            try:
                db.session.delete(student)
            except SQLAlchemyError:
                return {"msg": "Database Error"}, 400
        try:
            db.session.delete(school)
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Invalid Query Syntax"}, 400
        return json.dumps({'success': True})
    
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
            return {"msg": "Invalid Query Syntax"}, 400
        
        #TYPE CHECKING
        if type(name) is not str or type(address) is not str or type(longitude) is not float or type(latitude) is not float or type(arrival_time) is not str or type(departure_time) is not str:
            return {"msg": "Invalid Query Syntax"}, 400

        parsed_arrival_time = datetime.strptime(arrival_time, "%Y-%m-%dT%H:%M:%S.%fZ")
        parsed_departure_time = datetime.strptime(departure_time, "%Y-%m-%dT%H:%M:%S.%fZ")

        new_school = School(name=name, address=address, longitude=longitude, latitude=latitude, arrival_time=parsed_arrival_time, departure_time=parsed_departure_time)
        try:
            db.session.add(new_school)
            db.session.flush()
            db.session.refresh(new_school)
            db.session.commit()
        except SQLAlchemyError:
            return json.dumps({"success": False, "msg": "School Name already exists in Database"})
        return json.dumps({'success': True, 'id': new_school.id})
    
    if request.method == 'PATCH':
        content = request.json

        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return json.dumps({'error': 'Invalid School Id'})
        if 'name' in content:
            name = content.get('name', None)
            if type(name) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            school.name = name
        if 'address' in content:
            address = content.get('address', None)
            longitude = content.get('longitude', None)
            latitude = content.get('latitude', None)
            if not latitude or not longitude:
                return {"msg": "Invalid Query Syntax"}, 400
            if type(address) is not str or type(longitude) is not float or type(latitude) is not float:
                return {"msg": "Invalid Query Syntax"}, 400
            school.address = address
            school.longitude = longitude
            school.latitude = latitude
        if 'arrival_time' in content:
            arrival_time = content.get('arrival_time', None)
            if type(arrival_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            parsed_arrival_time = datetime.strptime(arrival_time, "%Y-%m-%dT%H:%M:%SZ")
            school.arrival_time = parsed_arrival_time
        if 'departure_time' in content:
            departure_time = content.get('departure_time', None)
            if type(departure_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            parsed_departure_time = datetime.strptime(departure_time, "%Y-%m-%dT%H:%M:%SZ")
            school.departure_time = parsed_departure_time
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400

        if 'arrival_time' in content or 'departure_time' in content:
            try:
                update_stop_calculations(school)
            except SQLAlchemyError:
                return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})

# ROUTE CRUD

@app.route('/route/<route_uid>', methods = ['OPTIONS'])
@app.route('/route', methods = ['OPTIONS'])
@cross_origin()
def route_options(route_uid=None):
    return json.dumps({'success':True})

@app.route('/route/<route_uid>', methods = ['GET'])
@app.route('/route', methods = ['GET'])
@cross_origin()
@admin_required()
def routes_get(route_uid=None):
    if request.method == 'GET':
        args = request.args
        name_search = args.get('name', '')
        page = args.get('page', None,type=int)
        sort = args.get('sort', None)
        direction = args.get('dir', 'asc')
        base_query = Route.query
        record_num = None

        if route_uid is not None:
            route = Route.query.filter_by(id=route_uid).first()
            if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
            route_dict = route.as_dict()
            stops = route.stops
            stop_dicts = []
            for stop in stops:
                stop_dicts.append(stop.as_dict())
            try:
                complete = check_complete(route_dict['students'], stop_dicts)
            except Exception:
                return json.dumps({'error': 'Error in Completion Calculation'})
            route_dict['complete'] = complete  
            return json.dumps({'success': True, 'route': route_dict})

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

        all_routes = []

        for route in base_query:
            stops = route.stops
            stop_dicts = []
            for stop in stops:
                stop_dicts.append(stop.as_dict())
            route_dict = route.as_dict()
            try:
                complete = check_complete(route_dict['students'], stop_dicts)
            except Exception:
                return json.dumps({'error': 'Error in Completion Calculation'})
            route_dict['complete'] = complete  
            all_routes.append(route_dict)     

        return json.dumps({'success':True, "routes": all_routes, "records": record_num})


@app.route('/route/<route_uid>', methods = ['PATCH','DELETE'])
@app.route('/route', methods = ['POST'])
@cross_origin()
@admin_required()
def routes(route_uid = None):
    if request.method == 'DELETE':
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
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
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})

    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)
        students = content.get('students',[])
        stops = content.get('stops', [])

        if not name or not school_id:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(school_id) is not int or type(stops) is not list or type(students) is not list or not all(isinstance(x, int) for x in students):
            return {"msg": "Invalid Query Syntax"}, 400

        school = School.query.filter_by(id=school_id).first()
        if school is None:
            return {"msg": "Invalid Query"}, 400

        new_route = Route(name = name, school_id = school_id)
        try:
            db.session.add(new_route)
            db.session.flush()
            db.session.refresh(new_route)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        
        for student_num in students:
            logging.debug("in here" + str(student_num))
            student = Student.query.filter_by(id=student_num).first()
            if student:
                student.route_id = new_route.id
        if 'description' in content:
            description = content.get('description', None)
            if type(description) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            new_route.description = description
        
        #ADDED THIS FOR STOPS
        sorted_stops = sorted(stops, key=lambda x: x['index'])
        dropoff_times, pickup_times = get_time_and_dist(sorted_stops, school.departure_time, school.arrival_time, school.latitude, school.longitude)
        for f in range(len(stops)):
            stop_info = sorted_stops[f]
            stop = Stop(name=stop_info['name'], route_id=new_route.id, latitude=stop_info['latitude'], longitude=stop_info['longitude'], index=f, pickup_time=pickup_times[f], dropoff_time=dropoff_times[f])
            db.session.add(stop)
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True, 'id': new_route.id})
    
    if request.method == 'PATCH':
        content = request.json

        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return json.dumps({'error': 'Invalid Route Id'})
        if 'students' in content:
            students = content.get('students',[])
            if type(students) is not list or not all(isinstance(x, int) for x in students):
                return {"msg": "Invalid Query Syntax"}, 400
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
                return {"msg": "Invalid Query Syntax"}, 400
            route.name = name
        if 'description' in content:
            description = content.get('description', None)
            if type(description) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            route.description = description
        if 'stops' in content:
            stops = content.get('stops', [])
            if type(stops) is not list:
                return {"msg": "Invalid Query Syntax"}, 400
            school = School.query.filter_by(id=route.school_id).first()
            if school is None:
                return {"msg": "Invalid Query"}, 400
            
            #DELETE ALL EXISTING STOPS
            existing_stops = Stop.query.filter_by(route_id=route_uid)
            for stop in existing_stops:
                db.session.delete(stop)
            
            #REPLACE WITH NEW STOPS
            sorted_stops = sorted(stops, key=lambda x: x['index'])
            dropoff_times, pickup_times = get_time_and_dist(sorted_stops, school.departure_time, school.arrival_time, school.latitude, school.longitude)
            for f in range(len(stops)):
                stop_info = sorted_stops[f]
                new_stop = Stop(name=stop_info['name'], route_id=route_uid, latitude=stop_info['latitude'], longitude=stop_info['longitude'], index=f, pickup_time=pickup_times[f], dropoff_time=dropoff_times[f])
                db.session.add(new_stop)   
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})


#STOP CRUD
@app.route('/stop/<stop_uid>', methods=['OPTIONS'])
@app.route('/stop', methods=['OPTIONS'])
@cross_origin()
def stop_options(stop_uid=None):
    return json.dumps({'success':True})

@app.route('/stop/<stop_uid>', methods=['GET'])
@cross_origin()
@jwt_required()
def stop_get(stop_uid=None):
    if request.method == 'GET':
        if stop_uid is not None:
            stop = Stop.query.filter_by(id=stop_uid).first()
            if stop is None:
                return json.dumps({'error': 'Invalid Stop Id'})
            return json.dumps({'success': True, 'stop': stop.as_dict()})
        else:
            return {"msg": "Invalid Query Syntax"}, 400

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
                incomplete.remove(stud_id)
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
        current_time = datetime.combine(date(1,1,1),departure_time)
        current_pickup = datetime.combine(date(1,1,1),arrival_time)
        
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
        for f in range(len(stops)):
            stop_info = sorted_stops[f]
            stop_to_edit = Stop.query.filter_by(id=stop_info['id'])
            stop_to_edit.pickup_time = pickup_times[f]
            stop_to_edit.dropoff_time = dropoff_times[f]
    db.session.commit()







app.register_blueprint(api, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)
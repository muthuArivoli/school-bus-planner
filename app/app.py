from flask import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Query
from sqlalchemy.exc import SQLAlchemyError
from flask_cors import CORS, cross_origin
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, unset_jwt_cookies, jwt_required, JWTManager, verify_jwt_in_request
from datetime import datetime, timedelta, timezone
import json
import sys
import logging
import bcrypt
import math

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+psycopg2://postgres:bus@db:5432/db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "29F884FD9AB88942F0A959BA7B8E4D2C4C60A190E71571BB80FFF3DDC0F4D0E9"
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)
ROWS_PER_PAGE = 10

db = SQLAlchemy(app)
cors = CORS(app)
api = Blueprint('api', __name__)

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
@cross_origin()
def current_user_options():
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

#USER CRUD

@app.route('/user/<user_id>', methods = ['OPTIONS'])
@app.route('/user', methods = ['OPTIONS'])
@cross_origin()
def user_options(username=None):
    return json.dumps({'success':True})

@app.route('/user/<user_id>', methods = ['GET'])
@app.route('/user', methods = ['GET'])
@cross_origin()
@jwt_required()
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

        new_user = User(email=email, full_name=name, uaddress = address, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'), latitude=latitude, longitude=longitude)
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
@jwt_required()
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
            student_filt = StudentFilter(data={'full_name': name_search, 'student_id': id_search, 'order_by': sort, 'page': page}).paginate()
            base_query = student_filt.get_objects()
            record_num = student_filt.count
        else:
            student_filt = StudentFilter(data={'full_name': name_search, 'student_id': id_search, 'order_by': sort})
            base_query = student_filt.apply()
            record_num = base_query.count()

        students = base_query


        if student_uid is not None:
            student = Student.query.filter_by(id=student_uid).first()
            if student is None:
                return json.dumps({'error': 'Invalid Student Id'})
            return json.dumps({'success': True, 'student': student.as_dict()})
        
        all_students = []
        for student in students:
            all_students.append(student.as_dict())
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

        new_student = Student(full_name=name, school_id=school_id, user_id=user_id)
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
            full_name = content.get('name', None)
            if type(full_name) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            student.full_name = full_name
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
@jwt_required()
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
        
        #REQUIRED FIELDS
        if not name or not address or not longitude or not latitude:
            return {"msg": "Invalid Query Syntax"}, 400
        
        #TYPE CHECKING
        if type(name) is not str or type(address) is not str or type(longitude) is not float or type(latitude) is not float:
            return {"msg": "Invalid Query Syntax"}, 400

        new_school = School(name=name, address=address, longitude=longitude, latitude=latitude)
        try:
            db.session.add(new_school)
            db.session.flush()
            db.session.refresh(new_school)
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
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
            if type(address) is not str or type(longitude) is not float or type(latitude) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            school.address = address
            school.longitude = longitude
            school.latitude = latitude
        try:
            db.session.commit()
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
@jwt_required()
def routes_get(route_uid=None):
    if request.method == 'GET':
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

        routes = base_query

        if route_uid is not None:
            route = Route.query.filter_by(id=route_uid).first()
            if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
            return json.dumps({'success': True, 'route': route.as_dict()})

        all_routes = []
        for route in routes:
            all_routes.append(route.as_dict())
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

        if not name or not school_id:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(school_id) is not int or type(students) is not list or not all(isinstance(x, int) for x in students):
            return {"msg": "Invalid Query Syntax"}, 400

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
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Invalid Query Syntax"}, 400
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
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})

# STOP CRUD

@app.route('/stop/<stop_uid>', methods = ['OPTIONS'])
@app.route('/stop', methods = ['OPTIONS'])
@cross_origin()
def stop_options(stop_uid=None):
    return json.dumps({'success':True})

@app.route('/stop/<stop_uid>', methods = ['GET'])
@cross_origin()
@jwt_required()
def stops_get(stop_uid=None):
    if request.method == 'GET':
        if stop_uid is not None:
            stop = Stop.query.filter_by(id=stop_uid).first()
            if stop is None:
                return json.dumps({'error': 'Invalid Stop Id'})
            return json.dumps({'success': True, 'stop': stop.as_dict()})
        else:
            return {"msg": "Invalid Query Syntax"}, 400

@app.route('/stop/<stop_uid>', methods = ['PATCH','DELETE'])
@app.route('/stop', methods = ['POST'])
@cross_origin()
@admin_required()
def stops(stop_uid = None):
    if request.method == 'DELETE':
        stop = Stop.query.filter_by(id=stop_uid).first()
        if stop is None:
            return json.dumps({'error': 'Invalid Stop Id'})
        try:
            db.session.delete(stop)
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})

    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        location = content.get('location', None)
        route_id = content.get('route_id', None)
        longitude = content.get('longitude', None)
        latitude = content.get('latitude', None)
        pickup_time = content.get('pickup_time', None)
        dropoff_time = content.get('dropoff_time', None)

        if not name or not location or not route_id or not longitude or not latitude:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(location) is not str or type(route_id) is not int or type(longitude) is not float or type(latitude) is not float:
            return {"msg": "Invalid Query Syntax"}, 400

        new_stop = Stop(name = name, route_id = route_id, location = location, longitude = longitude, latitude = latitude)
        try:
            db.session.add(new_stop)
            db.session.flush()
            db.session.refresh(new_stop)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        if 'pickup_time' in content:
            pickup_time = content.get('pickup_time', None)
            if type(pickup_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            #Add Try/Except
            parsed_time = datetime.strptime(pickup_time, "%Y-%m-%dT%H:%M:%SZ")
            new_stop.pickup_time = parsed_time
        if 'dropoff_time' in content:
            dropoff_time = content.get('dropoff_time', None)
            if type(dropoff_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            parsed_time = datetime.strptime(dropoff_time, "%Y-%m-%dT%H:%M:%SZ")
            new_stop.dropoff_time = parsed_time
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True, 'id': new_stop.id})
    
    if request.method == 'PATCH':
        content = request.json

        stop = Stop.query.filter_by(id=stop_uid).first()
        if stop is None:
            return json.dumps({'error': 'Invalid Stop Id'})
        if 'pickup_time' in content:
            pickup_time = content.get('pickup_time', None)
            if type(pickup_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            #Add Try/Except
            parsed_time = datetime.strptime(pickup_time, "%Y-%m-%dT%H:%M:%SZ")
            new_stop.pickup_time = parsed_time
        if 'dropoff_time' in content:
            dropoff_time = content.get('dropoff_time', None)
            if type(dropoff_time) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            parsed_time = datetime.strptime(dropoff_time, "%Y-%m-%dT%H:%M:%SZ")
            new_stop.dropoff_time = parsed_time
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})
    return json.dumps({'success': False})


      

app.register_blueprint(api, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)
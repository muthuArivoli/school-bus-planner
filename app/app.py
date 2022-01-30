from flask import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
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

db = SQLAlchemy(app)
cors = CORS(app)

from models import User, Student, School, Route

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


@app.route('/')
def hello_geek():
    return '<h1>Hello from Flask & Docker</h2>'

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

@app.route('/login', methods = ['POST'])
@cross_origin()
def login():
    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if not email or not password:
        return {"msg": "Invalid Query Syntax"}, 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return {"error": "There is no account associated with that email"}
    if not bcrypt.checkpw(password.encode('utf-8'), user.pswd.encode('utf-8')):
        return {"error": "Invalid password"}
    access_token = create_access_token(identity=email)
    response = {"access_token": access_token}
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
        search_keyword = args.get('search', None)
        if user_id is not None:
            user = User.query.filter_by(id=user_id).first()
            if user is None:
                return {"msg": "Invalid User ID"}, 400
            students = Student.query.filter_by(user_id = user_id).all()
            all_students = []
            for student in students:
                all_students.append(student.as_dict())
            return json.dumps({'success': True, 'user': user.as_dict(), 'students': all_students})
        if search_keyword:
            users = User.query.filter(User.name.contains(search_keyword))
            other_users = User.query.filter(User.email.contains(search_keyword))
            for us in other_users:
                users.append(us)
        else:
            users = User.query.all()
        all_users = []
        for user in users:
            all_users.append(user.as_dict())
        return json.dumps({'success': True, "users": all_users})


@app.route('/user/<username>', methods = ['PATCH','DELETE'])
@app.route('/user', methods = ['POST'])
@cross_origin()
@admin_required()
def users(username=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid Email'})
        students = Student.query.filter_by(user_id = user.id)
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

        if not email or not password or not name or not admin_flag:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(email) is not str or type(password) is not str or type(name) is not str or type(admin_flag) is not bool:
            return {"msg": "Invalid Query Syntax"}, 400
        
        user = User.query.filter_by(email=email).first()
        if user:
            return json.dumps({'error': 'User with this email exists'})

        encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(email=email, full_name=name, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'))
        try:
            db.session.add(new_user)
            db.session.flush()
            db.session.refresh(new_user)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        if 'address' in content:
            address = content.get('address', None)
            if type(address) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            new_user.uaddress = address
        try:
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True, 'id': new_user.id})

    if request.method == 'PATCH':
        content = request.json

        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid User'})
        
        else:
            if 'email' in content:
                email = content.get('email', None)
                if type(email) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.email = email
            if 'full_name' in content:
                full_name = content.get('full_name', None)
                if type(full_name) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.full_name = full_name
            if 'address' in content:
                address = content.get('address', None)
                if type(address) is not str:
                    return {"msg": "Invalid Query Syntax"}, 400
                user.uaddress = address
            if 'pswd' in content:
                pswd = content.get('pswd', None)
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
        search_keyword = args.get('search', None)
        if student_uid is not None:
            student = Student.query.filter_by(id=student_uid).first()
            if student is None:
                return json.dumps({'error': 'Invalid Student Id'})
            return json.dumps({'success': True, 'student': student.as_dict()})
        if search_keyword:
            try:
                num = int(search_keyword)
                students = Student.query.filter_by(student_id=num)
            except ValueError:
                students = []
            other_students = Student.query.filter(Student.full_name.contains(search_keyword))
            for stud in other_students:
                students.append(stud)
        else: 
            students = Student.query.all()
        all_students = []
        for student in students:
            all_students.append(student.as_dict())
        return json.dumps({'success':True, "students": all_students})

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
        name = content.get('full_name', None)
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
        if 'full_name' in content:
            full_name = content.get('full_name', None)
            if type(full_name) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            student.full_name = full_name
        if 'student_id' in content:
            student_id = content.get('student_id', None)
            if type(student_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.student_id = student_id
        if 'school_id' in content:
            school_id = content.get('school_id', None)
            if type(school_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.school_id = school_id
        if 'route_id' in content:
            route_id = content.get('route_id', None)
            if type(route_id) is not int:
                return {"msg": "Invalid Query Syntax"}, 400
            student.route_id = route_id
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
        search_keyword = args.get("search", None)
        if school_uid is not None:
            school = School.query.filter_by(id=school_uid).first()
            if school is None:
                return json.dumps({'error': 'Invalid School Id'})
            return json.dumps({'success': True, 'school': school.as_dict()})

        if search_keyword is not None:
            schools = School.query.filter(School.name.contains(search_keyword))
        else:
            schools = School.query.all()
        all_schools = []
        for school in schools:
            all_schools.append(school.as_dict())
        return json.dumps({'success':True, "schools": all_schools})
     

@app.route('/school/<school_uid>', methods = ['PATCH', 'DELETE'])
@app.route('/school', methods = ['POST'])
@cross_origin()
@admin_required()
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
        
        if not name or not address:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(address) is not str:
            return {"msg": "Invalid Query Syntax"}, 400

        new_school = School(name=name, address=address)
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
            if type(address) is not str:
                return {"msg": "Invalid Query Syntax"}, 400
            school.address = address
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
        search_keyword = args.get('search', None)
        if route_uid is not None:
            route = Route.query.filter_by(id=route_uid).first()
            if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
            return json.dumps({'success': True, 'route': route.asdict()})
        if search_keyword:
            routes = Route.query.filter(Route.name.contains(search_keyword))
        else:
            routes = Route.query.all()
        all_routes = []
        for route in routes:
            all_routes.append(route.as_dict())
        return json.dumps({'success':True, "routes": all_routes})


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
        for student in students:
            student.route_id = float("NaN")
        try:
            db.session.delete(route)
            db.session.commit()
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
        return json.dumps({'success': True})

    if request.method == 'POST':
        content = request.json
        name = content.get('name', None)
        school_id = content.get('school_id', None)

        if not name or not school_id:
            return {"msg": "Invalid Query Syntax"}, 400
        
        if type(name) is not str or type(school_id) is not int:
            return {"msg": "Invalid Query Syntax"}, 400

        new_route = Route(name = name, school_id = school_id)
        try:
            db.session.add(new_route)
            db.session.flush()
            db.session.refresh(new_route)
        except SQLAlchemyError:
            return {"msg": "Database Error"}, 400
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

if __name__ == "__main__":
    app.run(debug=True)
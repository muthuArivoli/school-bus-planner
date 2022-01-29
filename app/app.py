from flask import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
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


@app.route('/user/<username>', methods = ['GET','PATCH','DELETE'])
@app.route('/user', methods = ['GET','POST'])
# @jwt_required()
@admin_required()
@cross_origin()
def users(username=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid Email'})
        students = Student.query.filter_by(user_id = user.id)
        for student in students:
            db.session.delete(student)
        db.session.delete(user)
        db.session.commit()
        return json.dumps({'success': True})

    if request.method == 'GET':
        if username is not None:
            user = User.query.filter_by(email=username).first()
            students = Student.query.filter_by(user_id = user.id).all()
            all_students = []
            for student in students:
                all_students.append(student.as_dict())
            return json.dumps({'success': True, 'user': user.as_dict(), 'students': all_students})
        users = User.query.all()
        all_users = []
        for user in users:
            all_users.append(user.as_dict())
        return json.dumps({'success':True, "users": all_users})
    
    #Gotta add authentication that only an admin can do this
    if request.method == 'POST':
        content = request.json

        if 'email' not in content or 'password' not in content or 'name' not in content or 'admin_flag' not in content:
            return json.dumps({'error': 'Invalid query'})

        email = content['email']
        password = content['password']
        name = content['name']
        admin_flag = content['admin_flag']
        
        user = User.query.filter_by(email=email).first()
        if user:
            return json.dumps({'error': 'user exists'})

        encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(email=email, full_name=name, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'))
        db.session.add(new_user)
        db.session.flush()
        db.session.refresh(new_user)
        if 'address' in content:
            new_user.uaddress = content['address']
        db.session.commit()
        return json.dumps({'success': True, 'id': new_user.id})

    if request.method == 'PATCH':
        content = request.json

        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid User'})
        
        else:
            if 'email' in content:
                user.email = content['email']
            if 'full_name' in content:
                user.full_name = content['full_name']
            if 'address' in content:
                user.uaddress = content['address']
            if 'pswd' in content:
                pswd = content['pswd']
                encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
                user.pswd = encrypted_pswd.decode('utf-8')
            if 'admin_flag' in content:
                user.admin_flag = content['admin_flag']
        db.session.commit()
        return json.dumps({'success': True})
    return json.dumps({'success': False})


@app.route('/student/<student_uid>', methods = ['GET','PATCH', 'DELETE'])
@app.route('/student', methods = ['GET','POST'])
@cross_origin()
@admin_required()
# @jwt_required
def students(student_uid = None):
    if request.method == 'DELETE':

        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return json.dumps({'error': 'Invalid Student Id'})
        db.session.delete(student)
        db.session.commit()
        return json.dumps({'success': True})

    if request.method == 'GET':
        if student_uid is not None:
            student = Student.query.filter_by(id=student_uid).first()
            if student is None:
                return json.dumps({'error': 'Invalid Student Id'})
            return json.dumps({'success': True, 'student': student.as_dict()})
        students = Student.query.all()
        all_students = []
        for student in students:
            all_students.append(student.as_dict())
        return json.dumps({'success':True, "students": all_students})
    
    if request.method == 'POST':
        content = request.json

        if 'full_name' not in content or 'school_id' not in content or 'user_id' not in content:
            return json.dumps({'error': 'Invalid query'})

        name = content['full_name']
        school_id = content['school_id']
        user_id = content['user_id']

        user = User.query.filter_by(id=user_id).first()
        if user is None:
            return json.dumps({'error': 'Student doesn\'t belong to a user'})
        if user.uaddress is None:
            return json.dumps({'error': 'User must have an address to create a student'})

        new_student = Student(full_name=name, school_id=school_id, user_id=user_id)
        db.session.add(new_student)
        db.session.flush()
        db.session.refresh(new_student)
        if 'route_id' in content:
            new_student.route_id = content['route_id']
        if 'student_id' in content:
            new_student.student_id = content['student_id']
        db.session.commit()
        return json.dumps({'success': True, 'id': new_student.id})

    if request.method == 'PATCH':
        content = request.json
        student = Student.query.filter_by(id=student_uid).first()

        #MIGHT WANT TO ADD CHECKS FOR PATCHING INVALID DATA
        if student is None:
            return json.dumps({'error': 'Invalid Student Id'})
        if 'full_name' in content:
            student.full_name = content['full_name']
        if 'student_id' in content:
            student.student_id = content['student_id']
        if 'school_id' in content:
            student.school_id = content['school_id']
        if 'route_id' in content:
            student.route_id = content['route_id']
        db.session.commit()
        return json.dumps({'success': True})
    return json.dumps({'success': False})

@app.route('/school/<school_uid>', methods = ['GET','PATCH', 'DELETE'])
@app.route('/school/<search_keyword>', methods = ['GET'])
@app.route('/school', methods = ['GET','POST'])
# @jwt_required
@admin_required()
@cross_origin()
def schools(school_uid = None, search_keyword = None):  
    if request.method == 'DELETE':
        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return json.dumps({'error': 'Invalid School Id'})
        routes = Route.query.filter_by(school_id=school.id)
        students = Student.query.filter_by(school_id=school.id)
        for route in routes:
            db.session.delete(route)
        for student in students:
            db.session.delete(student)
        db.session.delete(school)
        db.session.commit()
        return json.dumps({'success': True})

    if request.method == 'GET':
        if school_uid is not None:
            school = School.query.filter_by(id=school_uid).first()
            if school is None:
                return json.dumps({'error': 'Invalid School Id'})
            return json.dumps({'success': True, 'school': school.as_dict()})

        if search_keyword is not None:
            schools = School.query.filter(School.name.contains(search_keyword))
            #FIX THIS
        else:
            schools = School.query.all()
        all_schools = []
        for school in schools:
            all_schools.append(school.as_dict())
        return json.dumps({'success':True, "schools": all_schools})
     
    if request.method == 'POST':
        content = request.json

        if 'name' not in content or 'address' not in content:
            return json.dumps({'error': 'Invalid query'})
        
        name = content['name']
        address = content['address']

        new_school = School(name=name, address=address)
        db.session.add(new_school)
        db.session.flush()
        db.session.refresh(new_school)
        db.session.commit()
        return json.dumps({'success': True, 'id': new_school.id})
    
    if request.method == 'PATCH':
        content = request.json

        school = School.query.filter_by(id=school_uid).first()
        if school is None:
            return json.dumps({'error': 'Invalid School Id'})
        if 'name' in content:
            school.name = content['name']
        if 'address' in content:
            school.address = content['address']
        db.session.commit()
        return json.dumps({'success': True})
    return json.dumps({'success': False})

@app.route('/route/<route_uid>', methods = ['GET','PATCH','DELETE'])
@app.route('/route', methods = ['GET','POST'])
# @jwt_required
@admin_required()
@cross_origin()
def routes(route_uid = None):
    if request.method == 'DELETE':
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
        students = Student.query.filter_by(route_id=route.id)
        for student in students:
            student.route_id = float("NaN")
        db.session.delete(route)
        db.session.commit()
        return json.dumps({'success': True})
    
    if request.method == 'GET':
        if route_uid is not None:
            route = Route.query.filter_by(id=route_uid).first()
            if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
            return json.dumps({'success': True, 'route': route.as_dict()})
        routes = Route.query.all()
        all_routes = []
        for route in routes:
            all_routes.append(route.as_dict())
        return json.dumps({'success':True, "routes": all_routes})

    if request.method == 'POST':
        content = request.json

        if 'name' not in content or 'school_id' not in content:
            return json.dumps({'error': 'Invalid query'})

        name = content['name']
        school_id = content['school_id']

        new_route = Route(name = name, school_id = school_id)
        db.session.add(new_route)
        db.session.flush()
        db.session.refresh(new_route)
        if 'description' in content:
            new_route.description = content['description']
        db.session.commit()
        return json.dumps({'success': True, 'id': new_route.id})
    
    if request.method == 'PATCH':
        content = request.json

        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
            return json.dumps({'error': 'Invalid Route Id'})
        if 'name' in content:
            route.name = content['name']
        if 'description' in content:
            route.description = content['description']
        if 'school_id' in content:
            route.school_id = content['school_id']
        db.session.commit()
        return json.dumps({'success': True})
    return json.dumps({'success': False})

if __name__ == "__main__":
    app.run(debug=True)
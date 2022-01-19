from flask import *
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
import json
import sys
import logging
import bcrypt
import math

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+psycopg2://postgres:bus@db:5432/db'
app.config['SQLALCHEM_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
cors = CORS(app)

from models import User, Student, School, Route

db.create_all()

logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

@app.route('/')
def hello_geek():
    return '<h1>Hello from Flask & Docker</h2>'

@app.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    if request.method == 'POST':
        content = request.json
        email = content['email']
        password = content['password']
        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user.pswd.encode('utf-8')):
            return json.dumps({'success': False})
        return json.dumps({'success': True})
    return json.dumps({'login': True})


@app.route('/user/<username>', methods=['GET', 'DELETE'])
@app.route('/user', methods=['GET','POST'])
@cross_origin()
def users(username=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid Email'})
        db.session.delete(user)
        db.commit()
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
        email = content['email']
        logging.debug(email)
        password = content['password']
        name = content['name']
        address = content['address']
        admin_flag = content['admin']

        user = User.query.filter_by(email=email).first()
        logging.debug(user)
        if user:
            return json.dumps({'error': 'user exists'})
        
        encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        new_user = User(email=email, full_name=name, address=address, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'))
        db.session.add(new_user)
        db.session.flush()
        db.session.refresh(new_user)
        db.session.commit()
        return json.dumps({'success': True, 'id': new_user.id})
    return json.dumps({'success': False})


@app.route('/student/<student_uid>', methods=['GET','PATCH','DELETE'])
@app.route('/student', methods=['GET','POST'])
@cross_origin()
def students(student_uid = None):
    if request.method == 'DELETE':
        student = Student.query.filter_by(id=student_uid).first()
        if student is None:
            return json.dumps({'error': 'Invalid Student Id'})
        db.session.delete(student)
        db.commit()
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
        name = content['full_name']
        student_id = content['student_id']
        school_id = content['school_id']
        route_id = content['route_id']
        if math.isnan(route_id):
            route_id = None
        user_id = content['user_id']
        new_student = Student(full_name=name, student_id=student_id, school_id=school_id, route_id=route_id, user_id=user_id)
        db.session.add(new_student)
        db.session.flush()
        db.session.refresh(new_student)
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

@app.route('/school/<school_uid>', methods=['GET','PATCH','DELETE'])
@app.route('/school', methods=['GET','POST'])
@cross_origin()
def schools(school_uid = None):  
    if request.method == 'DELETE':
        school = School.query.filter_by(id=school_uid).first()
        if school is None:
                return json.dumps({'error': 'Invalid School Id'})
        db.session.delete(school)
        db.commit()
        return json.dumps({'success': True})

    if request.method == 'GET':
        if school_uid is not None:
            school = School.query.filter_by(id=school_uid).first()
            if school is None:
                return json.dumps({'error': 'Invalid School Id'})
            return json.dumps({'success': True, 'school': school.as_dict()})
        schools = School.query.all()
        all_schools = []
        for school in schools:
            all_schools.append(school.as_dict())
        return json.dumps({'success':True, "schools": all_schools})
     
    if request.method == 'POST':
        content = request.json
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

@app.route('/route/<route_uid>', methods=['GET','PATCH','DELETE'])
@app.route('/route', methods=['GET','POST'])
@cross_origin()
def routes(route_uid = None):
    if request.method == 'DELETE':
        route = Route.query.filter_by(id=route_uid).first()
        if route is None:
                return json.dumps({'error': 'Invalid Route Id'})
        db.session.delete(route)
        db.commit()
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
        logging.debug(content)
        name = content['name']
        description = content['description']
        school_id = content['school_id']
        new_route = Route(name=name, description=description, school_id = school_id)
        db.session.add(new_route)
        db.session.flush()
        db.session.refresh(new_route)
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
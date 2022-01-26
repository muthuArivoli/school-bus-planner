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

@app.route('/login', methods = ['POST', 'OPTIONS'])
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

@app.route('/user/<username>/<current_id>', methods = ['DELETE'])
@app.route('/user/<username>', methods = ['GET','PATCH'])
@app.route('/user', methods = ['GET','POST'])
@cross_origin()
def users(username=None, current_id=None):
    if request.method == 'DELETE':
        if current_id is None:
            return json.dumps({'error': 'Invalid Permissions'})
        current_user = User.query.filter_by(id=current_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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

        if 'email' not in content or 'password' not in content or 'current_user_id' not in content or 'name' not in content or 'admin_flag' not in content:
            return json.dumps({'error': 'Invalid query'})

        email = content['email']
        password = content['password']
        name = content['name']
        admin_flag = content['admin_flag']
        current_user_id = content['current_user_id']
        
        current_user = User.query.filter_by(id=current_user_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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
        change_pswd_patch = False
        if 'current_user_id' not in content:
            return json.dumps({'error':'Invalid query'})
        
        current_user_id = content['current_user_id']
        current_user = User.query.filter_by(id=current_user_id).first()

        user = User.query.filter_by(email=username).first()
        if user is None:
            return json.dumps({'error': 'Invalid User'})
        
        if user == current_user:
            change_pswd_patch = True

        if current_user:
            if current_user.admin_flag == False and change_pswd_patch == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})


        if change_pswd_patch:
            if 'pswd' in content:
                pswd = content['pswd']
                encrypted_pswd = bcrypt.hashpw(pswd.encode('utf-8'), bcrypt.gensalt())
                user.pswd = encrypted_pswd.decode('utf-8')
        
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


@app.route('/student/<student_uid>/<current_id>', methods = ['DELETE'])
@app.route('/student/<student_uid>', methods = ['GET','PATCH'])
@app.route('/student', methods = ['GET','POST'])
@cross_origin()
def students(student_uid = None, current_id = None):
    if request.method == 'DELETE':
        if current_id is None:
            return json.dumps({'error': 'Invalid Permissions'})
        current_user = User.query.filter_by(id=current_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'Invalid current user'})

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

        if 'full_name' not in content or 'school_id' not in content or 'current_user_id' not in content or 'user_id' not in content:
            return json.dumps({'error': 'Invalid query'})

        name = content['full_name']
        school_id = content['school_id']
        current_user_id = content['current_user_id']
        user_id = content['user_id']

        current_user = User.query.filter_by(id=current_user_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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

        if 'current_user_id' not in content:
            return json.dumps({'error':'Invalid query'})
        
        current_user_id = content['current_user_id']
        current_user = User.query.filter_by(id=current_user_id).first()

        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})


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

@app.route('/school/<school_uid>/<current_id>', methods = ['DELETE'])
@app.route('/school/<school_uid>', methods = ['GET','PATCH'])
@app.route('/school/<search_keyword>', methods = ['GET'])
@app.route('/school', methods = ['GET','POST'])
@cross_origin()
def schools(school_uid = None, search_keyword = None, current_id=None):  
    if request.method == 'DELETE':
        if current_id is None:
            return json.dumps({'error': 'Invalid Permissions'})
        current_user = User.query.filter_by(id=current_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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

        if 'name' not in content or 'address' not in content or 'current_user_id' not in content:
            return json.dumps({'error': 'Invalid query'})
        
        name = content['name']
        address = content['address']
        current_user_id = content['current_user_id']

        current_user = User.query.filter_by(id=current_user_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

        new_school = School(name=name, address=address)
        db.session.add(new_school)
        db.session.flush()
        db.session.refresh(new_school)
        db.session.commit()
        return json.dumps({'success': True, 'id': new_school.id})
    
    if request.method == 'PATCH':
        content = request.json

        if 'current_user_id' not in content:
            return json.dumps({'error':'Invalid query'})
        
        current_user_id = content['current_user_id']
        current_user = User.query.filter_by(id=current_user_id).first()

        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})


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

@app.route('/route/<route_uid>/<current_id>', methods = ['DELETE'])
@app.route('/route/<route_uid>', methods = ['GET','PATCH'])
@app.route('/route', methods = ['GET','POST'])
@cross_origin()
def routes(route_uid = None, current_id = None):
    if request.method == 'DELETE':
        if current_id is None:
            return json.dumps({'error': 'Invalid Permissions'})
        current_user = User.query.filter_by(id=current_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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

        if 'name' not in content or 'school_id' not in content or 'current_user_id' not in content:
            return json.dumps({'error': 'Invalid query'})

        name = content['name']
        school_id = content['school_id']
        current_user_id = content['current_user_id']
        
        current_user = User.query.filter_by(id=current_user_id).first()
        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})

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
        
        if 'current_user_id' not in content:
            return json.dumps({'error':'Invalid query'})
        
        current_user_id = content['current_user_id']
        current_user = User.query.filter_by(id=current_user_id).first()

        if current_user:
            if current_user.admin_flag == False:
                return json.dumps({'error': 'User not authorized to execute this action'})
        else:
            return json.dumps({'error': 'invalid current user'})


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
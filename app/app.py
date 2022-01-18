from flask import *
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
import json
import sys
import logging
import bcrypt

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


@app.route('/user/<username>', methods=['GET', 'POST', 'DELETE'])
@app.route('/user', methods=['GET','POST'])
@cross_origin()
def users(username=None):
    if request.method == 'DELETE':
        user = User.query.filter_by(email=username).first()
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
        logging.debug(all_users)
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
        
        new_user = User(email=email, full_name=name, uaddress=address, admin_flag=admin_flag, pswd=encrypted_pswd.decode('utf-8'))
        db.session.add(new_user)
        db.session.commit()
        return json.dumps({'success': True})
    return json.dumps({'success': False})







if __name__ == "__main__":
    app.run(debug=True)
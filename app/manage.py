from flask.cli import FlaskGroup
import bcrypt
from app import app, db
from models import User, School, Student, RoleEnum
import pandas as pd
import googlemaps
import logging
import math

logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')


cli = FlaskGroup(app)
gmaps_key = googlemaps.Client(key="AIzaSyB0b7GWpLob05JP7aVeAt9iMjY0FjDv0_o")

@cli.command("create_db")
def create_db():
    db.drop_all()
    db.create_all()
    db.session.commit()

@cli.command("seed_db_admin")
def seed_db_admin():
    password = 'AdminPassword'
    addr = '401 Chapel Dr, Durham, NC 27705'
    lat,lng = geocode_address(addr)
    encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(email='admin@example.com', full_name='Admin', uaddress = addr, pswd=encrypted_pswd.decode('utf-8'), role=RoleEnum.ADMIN, latitude=lat, longitude=lng, phone="919-555-5555")
    db.session.add(new_user)
    db.session.commit()

@cli.command("seed_db")
def seed_db():
    password = "ParentPswd2@22"
    encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    schools_table = pd.read_csv('data/schools.csv', dtype={'arrivalTime': object, 'departureTime': object})
    school_names = schools_table['name']
    addresses = schools_table['address']
    arrival_time = schools_table['arrivalTime']
    departure_time = schools_table['departureTime']
    for f in range(0,len(school_names)):
        lat,lng = geocode_address(addresses[f])
        arrival = arrival_time[f]
        dept = departure_time[f]
        parsedArrival = arrival[:2] + ":" + arrival[2:]
        parsedDeparture = dept[:2] + ":" + dept[2:]
        new_school = School(name=school_names[f], address=addresses[f], latitude=lat, longitude=lng, arrival_time = parsedArrival, departure_time = parsedDeparture)
        db.session.add(new_school)
        db.session.flush()
        db.session.refresh(new_school)

    # parents_table = pd.read_csv('data/parents.csv')
    # names = parents_table['full_name'].to_list()
    # emails = parents_table['email'].to_list()
    # addresses = parents_table['address'].to_list()

    # students_table = pd.read_csv('data/students.csv')
    # student_ids = students_table['student_id'].to_list()
    # student_names = students_table['name'].to_list()
    # student_schools = students_table['school'].to_list()
    # parents = students_table['parent'].to_list()

    # for f in range(0, len(names)):
    #     lat,lng = geocode_address(addresses[f])
    #     new_user = User(email=emails[f], full_name=names[f], uaddress = addresses[f], pswd=encrypted_pswd.decode('utf-8'), role=RoleEnum.UNPRIVILEGED, latitude=lat, longitude=lng, phone="919-555-5555")
    #     db.session.add(new_user)
    #     db.session.flush()
    #     db.session.refresh(new_user)

    # for f in range(0,len(student_ids)):
    #     associated_school = School.query.filter_by(name = student_schools[f]).first()
    #     associated_parent = User.query.filter_by(email = parents[f]).first()
    #     new_student = Student(name=student_names[f], school_id=associated_school.id, user_id=associated_parent.id)
    #     if not math.isnan(student_ids[f]):
    #         new_student.student_id = student_ids[f]
    #     db.session.add(new_student)
    
    db.session.commit()

def geocode_address(addr):
    g = gmaps_key.geocode(addr)
    lat = g[0]["geometry"]["location"]["lat"]
    lng = g[0]["geometry"]["location"]["lng"]
    return lat, lng

if __name__ == "__main__":
    cli()
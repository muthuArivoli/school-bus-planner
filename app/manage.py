from flask.cli import FlaskGroup
import bcrypt
from app import app, db
from models import User, School, Student
import pandas as pd


cli = FlaskGroup(app)


@cli.command("create_db")
def create_db():
    db.drop_all()
    db.create_all()
    db.session.commit()


@cli.command("seed_db_admin")
def seed_db_admin():
    password = 'AdminPassword'
    encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(email='admin@example.com', full_name='Admin', pswd=encrypted_pswd.decode('utf-8'), admin_flag=1)
    db.session.add(new_user)
    db.session.commit()

@cli.command("seed_db")
def seed_db():
    password = "ParentPswd2@22"
    encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    schools_table = pd.read_csv('data/schools.csv')
    school_names = schools_table['name']
    addresses = schools_table['address']
    for f in range(0,len(school_names)):
        new_school = School(name=school_names[f], address=addresses[f])
        db.session.add(new_school)
        db.session.flush()
        db.session.refresh(new_school)

    parents_table = pd.read_csv('data/parents.csv')
    names = parents_table['full_name'].to_list()
    emails = parents_table['email'].to_list()
    addresses = parents_table['address'].to_list()

    students_table = pd.read_csv('data/students.csv')
    student_names = students_table['name'].to_list()
    student_schools = students_table['school'].to_list()

    for f in range(0,len(names)):
        new_user = User(email=emails[f], full_name=names[f], pswd=encrypted_pswd.decode('utf-8'), admin_flag=0)
        new_user.address = addresses[f]
        db.session.add(new_user)
        db.session.flush()
        db.session.refresh(new_user)
        associated_school = School.query.filter_by(name = student_schools[f]).first()
        new_student = Student(full_name=student_names[f], school_id=associated_school.id, user_id=new_user.id)
        db.session.add(new_student)
    
    db.session.commit()

    


if __name__ == "__main__":
    cli()
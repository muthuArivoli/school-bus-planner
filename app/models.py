from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String())
    full_name = db.Column(db.String())
    uaddress = db.Column(db.String())
    pswd = db.Column(db.String())
    admin_flag = db.Column(db.Boolean())

    def __repr__(self):
        return "<User(email='{}', full_name='{}', uaddress={}, pswd={}, admin_flag={})>"\
            .format(self.email, self.full_name, self.uaddress, self.pswd, self.admin_flag) 

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    address = db.Column(db.String())
    

    def __repr__(self):
        return "<School(name='{}', address='{}')>"\
            .format(self.name, self.address)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    description = db.Column(db.String())

    def __repr__(self):
        return "<Route(name='{}', school_id='{}', description={})>"\
            .format(self.name, self.school_id, self.description)

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String())
    student_id = db.Column(db.Integer)
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    user_id = db.Column(db.Integer, ForeignKey('users.id'))

    def __repr__(self):
        return "<Student(full_name='{}', student_id='{}', school_id={}, route_id={}, user_id={})>"\
            .format(self.full_name, self.student_id, self.school_id, self.route_id, self.user_id)

# engine = create_engine('postgresql+psycopg2://postgres:bus@db:5432/db', echo = True)
# Session = sessionmaker(bind = engine)
# session = Session()

# c1 = User(email='cac.100199@gmail.com', full_name='Claudia Chapman', uaddress='10 Warren Ave', pswd='S@cred18', admin_flag=0)
# session.add(c1)
# session.commit()

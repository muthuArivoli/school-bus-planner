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

    def as_dict(self):
       return {"id": getattr(self, "id"), "email": getattr(self, 'email'), "name": getattr(self, 'full_name'), "address": getattr(self, 'uaddress'), "admin_flag": getattr(self,'admin_flag')}

    def __repr__(self):
        return "<User(email='{}', full_name='{}', pswd={}, admin_flag={})>"\
            .format(self.email, self.full_name, self.pswd, self.admin_flag) 

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    address = db.Column(db.String())

    def as_dict(self):
        return {"id":getattr(self, "id"), "name": getattr(self, 'name'), "address": getattr(self, 'address')}

    def __repr__(self):
        return "<School(name='{}', address='{}')>"\
            .format(self.name, self.address)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    description = db.Column(db.String())

    def as_dict(self):
        return {"id": getattr(self, "id"), "name": getattr(self, 'name'), "school_id": getattr(self, 'school_id'), "description": getattr(self, "description")}

    def __repr__(self):
        return "<Route(name='{}', school_id='{}')>"\
            .format(self.name, self.school_id)

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String())
    student_id = db.Column(db.Integer)
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    user_id = db.Column(db.Integer, ForeignKey('users.id'))

    def as_dict(self):
        return{"name": getattr(self, 'full_name'), "student_id": getattr(self, "student_id"), "id": getattr(self, "id"), "school_id": getattr(self, "school_id"), "route_id": getattr(self, "route_id")}


    def __repr__(self):
        return "<Student(full_name='{}', school_id={}, user_id={})>"\
            .format(self.full_name, self.school_id, self.user_id)

# engine = create_engine('postgresql+psycopg2://postgres:bus@db:5432/db', echo = True)
# Session = sessionmaker(bind = engine)
# session = Session()

# c1 = User(email='admin@gmail.com', address = '', full_name='Admin', pswd='AdminPassword', admin_flag=1)
# session.add(c1)
# session.commit()

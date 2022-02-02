from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import inspect

from sqlalchemy_filters import Filter, StringField, Field
from sqlalchemy_filters.operators import ContainsOperator, EqualsOperator


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String())
    full_name = db.Column(db.String())
    uaddress = db.Column(db.String())
    pswd = db.Column(db.String())
    admin_flag = db.Column(db.Boolean())
    children = relationship("Student")

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main.pop('pswd')
        students = [student.id for student in self.children]
        main['children'] = students
        return main

    def __repr__(self):
        return "<User(email='{}', full_name='{}', pswd={}, admin_flag={})>"\
            .format(self.email, self.full_name, self.pswd, self.admin_flag) 

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    address = db.Column(db.String())
    routes = relationship("Route")
    students = relationship("Student")

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        routes = [route.as_dict() for route in self.routes]
        students = [student.id for student in self.students]
        main['routes'] = routes
        main['students'] = students
        return main

    def __repr__(self):
        return "<School(name='{}', address='{}')>"\
            .format(self.name, self.address)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    description = db.Column(db.String())
    students = relationship("Student")

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        students = [student.id for student in self.students]
        main['students'] = students
        return main

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



class UserFilter(Filter):
    email = StringField(lookup_operator=ContainsOperator)
    full_name = StringField(lookup_operator=ContainsOperator)

    class Meta:
        model = User
        session = db.session
        page_size = 10

class StudentFilter(Filter):
    student_id = Field(lookup_operator = EqualsOperator)
    school_id = Field(lookup_operator = EqualsOperator)
    full_name = StringField(lookup_operator=ContainsOperator)

    class Meta:
        model = Student
        session = db.session
        page_size = 10

class SchoolFilter(Filter):
    name = StringField(lookup_operator=ContainsOperator)

    class Meta:
        model = School
        session = db.session
        page_size = 10

class RouteFilter(Filter):
    name = StringField(lookup_operator=ContainsOperator)
    school_id = Field()

    class Meta:
        model = Route
        session = db.session
        page_size = 10
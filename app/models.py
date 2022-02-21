from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine, CheckConstraint
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import inspect, select, func
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method

from sqlalchemy_filters import Filter, StringField, Field, TimestampField
from sqlalchemy_filters.operators import ContainsOperator, EqualsOperator
from datetime import datetime
import logging
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')



class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String())
    full_name = db.Column(db.String())
    uaddress = db.Column(db.String())
    pswd = db.Column(db.String())
    admin_flag = db.Column(db.Boolean())
    children = relationship("Student")
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main.pop('pswd')
        students = [student.id for student in self.children]
        main['children'] = students
        return main

    def __repr__(self):
        return "<User(email='{}', uaddress='{}',full_name='{}', pswd='{}', admin_flag={}, latitude={}, longitude={})>"\
            .format(self.email, self.uaddress, self.full_name, self.pswd, self.admin_flag, self.latitude, self.longitude)
  

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True)
    address = db.Column(db.String())
    routes = relationship("Route")
    students = relationship("Student")
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())
    arrival_time = db.Column(db.Time())
    departure_time = db.Column(db.Time())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        routes = [route.as_dict() for route in self.routes]
        students = [student.id for student in self.students]
        main['routes'] = routes
        main['students'] = students
        main['arrival_time'] = self.arrival_time.isoformat()
        main['departure_time'] = self.departure_time.isoformat()
        return main

    def __repr__(self):
        return "<School(name='{}', address='{}',latitude={}, longitude={}, 'arrival_time='{}', departure_time='{}')>"\
            .format(self.name, self.address, self.latitude, self.longitude, self.arrival_time, self.departure_time)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    description = db.Column(db.String())
    students = relationship("Student")
    stops = relationship("Stop")

    @hybrid_property
    def student_count(self):
        return self.students.count()
    
    @student_count.expression
    def student_count(cls):
        return (select([func.count(Student.id)]).
                where(Student.route_id == cls.id).
                label("student_count")
                )

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        students = [student.id for student in self.students]
        stops = [stop.id for stop in self.stops]
        main['students'] = students
        main['stops'] = stops
        return main

    def __repr__(self):
        return "<Route(name='{}', school_id={})>"\
            .format(self.name, self.school_id)

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    student_id = db.Column(db.Integer)
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    user_id = db.Column(db.Integer, ForeignKey('users.id'))
    __table_args__ = (
        CheckConstraint(student_id >= 0, name='check_id_positive'),
        {})

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        return main

    def __repr__(self):
        return "<Student(name='{}', school_id={}, user_id={})>"\
            .format(self.name, self.school_id, self.user_id)

class TokenBlocklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False)

class Stop(db.Model):
    __tablename__ = 'stops'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    pickup_time = db.Column(db.Time())
    dropoff_time = db.Column(db.Time())
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())
    index = db.Column(db.Integer)

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        logging.debug(type(self.pickup_time))
        main['pickup_time'] = self.pickup_time.isoformat()
        main['dropoff_time'] = self.dropoff_time.isoformat()
        return main

    def __repr__(self):
        return "<Stop(name='{}', route_id={}, latitude={}, longitude={}, index={}, pickup_time={}, dropoff_time={})>"\
            .format(self.name, self.route_id, self.latitude, self.longitude, self.index, self.pickup_time, self.dropoff_time)


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
    name = StringField(lookup_operator = ContainsOperator)

    class Meta:
        model = Student
        session = db.session
        page_size = 10

class SchoolFilter(Filter):
    name = StringField(lookup_operator=ContainsOperator)
    arrival_time = TimestampField()
    departure_time = TimestampField()

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
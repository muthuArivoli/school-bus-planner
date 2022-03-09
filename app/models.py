from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine, CheckConstraint, Enum
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import inspect, select, func
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy.sql.operators import contains_op

import enum
from sqlalchemy_filters import Filter, StringField, Field, TimestampField
from sqlalchemy_filters.operators import ContainsOperator, EqualsOperator, BaseOperator, register_operator
from datetime import datetime
import logging
import geopy.distance
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

def get_distance(lat1, long1, lat2, long2):
    coords_1 = (lat1, long1)
    coords_2 = (lat2, long2)
    return geopy.distance.geodesic(coords_1, coords_2).miles 

class RoleEnum(enum.IntEnum):
    UNPRIVILEGED = 0
    ADMIN = 1
    SCHOOL_STAFF = 2
    DRIVER = 3

managed_school_table = db.Table('managed_schools',
    db.Column('user_id', ForeignKey('users.id'), primary_key=True),
    db.Column('school_id', ForeignKey('schools.id'), primary_key=True),
)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(), unique=True)
    full_name = db.Column(db.String())
    uaddress = db.Column(db.String())
    pswd = db.Column(db.String())
    managed_schools = relationship("School", secondary=managed_school_table, back_populates="school_managers")
    role = db.Column(db.Enum(RoleEnum))
    children = relationship("Student", back_populates="user", cascade="all, delete-orphan")
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())
    phone = db.Column(db.String())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main.pop('pswd')
        main['children'] = [child.as_dict() for child in self.children]
        if self.role == RoleEnum.SCHOOL_STAFF:
            main['managed_schools'] = [school.as_dict() for school in self.managed_schools]
        return main

    def __repr__(self):
        return "<User(email='{}', uaddress='{}',full_name='{}', pswd='{}', role={}, latitude={}, longitude={})>"\
            .format(self.email, self.uaddress, self.full_name, self.pswd, self.role, self.latitude, self.longitude)

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True)
    address = db.Column(db.String())
    routes = relationship("Route", back_populates='school', cascade="all, delete-orphan")
    students = relationship("Student", back_populates='school', cascade="all, delete-orphan")
    school_managers = relationship("User", secondary=managed_school_table, back_populates="managed_schools")
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())
    arrival_time = db.Column(db.Time())
    departure_time = db.Column(db.Time())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main['arrival_time'] = self.arrival_time.isoformat()
        main['departure_time'] = self.departure_time.isoformat()
        main['routes'] = [route.as_dict() for route in self.routes]
        main['students'] = [student.as_dict() for student in self.students]
        return main

    def __repr__(self):
        return "<School(name='{}', address='{}',latitude={}, longitude={}, 'arrival_time='{}', departure_time='{}')>"\
            .format(self.name, self.address, self.latitude, self.longitude, self.arrival_time, self.departure_time)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    school = relationship("School", back_populates="routes")
    description = db.Column(db.String())
    students = relationship("Student", back_populates="route")
    stops = relationship("Stop", back_populates="route", cascade="all, delete-orphan")

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
        main['students'] = [student.as_dict() for student in self.students]
        main['stops'] = [stop.as_dict() for stop in self.stops]
        main['school'] = {c.key: getattr(self.school, c.key) for c in inspect(self.school).mapper.column_attrs}
        main['school']['arrival_time'] = self.school.arrival_time.isoformat()
        main['school']['departure_time'] = self.school.departure_time.isoformat()
        main['complete'] = True
        for student in main['students']:
            if not student['in_range']:
                main['complete'] = False
                break
        return main

    def __repr__(self):
        return "<Route(name='{}', school_id={})>"\
            .format(self.name, self.school_id)

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    student_id = db.Column(db.Integer, nullable=True)
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    school = relationship("School", back_populates="students")
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    route = relationship("Route", back_populates="students")
    user_id = db.Column(db.Integer, ForeignKey('users.id'))
    user = relationship("User", back_populates="children")
    __table_args__ = (
        CheckConstraint(student_id >= 0, name='check_id_positive'),
        {})

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main['school'] = {c.key: getattr(self.school, c.key) for c in inspect(self.school).mapper.column_attrs}
        main['school']['arrival_time'] = self.school.arrival_time.isoformat()
        main['school']['departure_time'] = self.school.departure_time.isoformat()
        main['route'] = None
        main['in_range'] = False
        if self.route is not None:
            main['route'] = {c.key: getattr(self.route, c.key) for c in inspect(self.route).mapper.column_attrs}
            for stop in self.route.stops:
                if get_distance(stop.latitude, stop.longitude, self.user.latitude, self.user.longitude) < 0.3:
                    main['in_range'] = True
                    break
        main['user'] = {c.key: getattr(self.user, c.key) for c in inspect(self.user).mapper.column_attrs}
        main['user'].pop('pswd')
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
    route = relationship("Route", back_populates="stops")
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())
    index = db.Column(db.Integer)

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main['pickup_time'] = self.pickup_time.isoformat()
        main['dropoff_time'] = self.dropoff_time.isoformat()
        return main

    def __repr__(self):
        return "<Stop(name='{}', route_id={}, latitude={}, longitude={}, index={}, pickup_time={}, dropoff_time={})>"\
            .format(self.name, self.route_id, self.latitude, self.longitude, self.index, self.pickup_time, self.dropoff_time)

@register_operator(sql_operator=contains_op)
class CaseContainsOperator(BaseOperator):
    def to_sql(self):
        return self.operator(
            func.lower(self.get_sql_expression()), func.lower(*self.params)
        )

class UserFilter(Filter):
    email = StringField(lookup_operator=CaseContainsOperator)
    full_name = StringField(lookup_operator=CaseContainsOperator)

    class Meta:
        model = User
        page_size = 10

class StudentFilter(Filter):
    student_id = Field(lookup_operator = EqualsOperator)
    school_id = Field(lookup_operator = EqualsOperator)
    name = StringField(lookup_operator = CaseContainsOperator)

    class Meta:
        model = Student
        page_size = 10

class SchoolFilter(Filter):
    name = StringField(lookup_operator=CaseContainsOperator)
    arrival_time = TimestampField()
    departure_time = TimestampField()

    class Meta:
        model = School
        page_size = 10

class RouteFilter(Filter):
    name = StringField(lookup_operator=CaseContainsOperator)
    school_id = Field()

    class Meta:
        model = Route
        page_size = 10
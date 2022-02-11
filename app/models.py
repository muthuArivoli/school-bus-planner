from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine, CheckConstraint
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import inspect, select, func
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method

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
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        main.pop('pswd')
        students = [student.id for student in self.children]
        main['children'] = students
        return main

    def __repr__(self):
        return "<User(email='{}', uaddress='{}',full_name='{}', pswd={}, admin_flag={}, latitude='{}', longitude='{})>"\
            .format(self.email, self.uaddress, self.full_name, self.pswd, self.admin_flag, self.latitude, self.longitude)
  

class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(), unique=True)
    address = db.Column(db.String())
    routes = relationship("Route")
    students = relationship("Student")
    #CHECK THIS DATATYPE...
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
        return main

    def __repr__(self):
        return "<School(name='{}', address='{}',latitude='{}', longitude='{})>"\
            .format(self.name, self.address, self.latitude, self.longitude)

class Route(db.Model):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    school_id = db.Column(db.Integer, ForeignKey('schools.id'))
    description = db.Column(db.String())
    students = relationship("Student")
    complete = db.Column(db.Boolean())
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
    __table_args__ = (
        CheckConstraint(student_id >= 0, name='check_id_positive'),
        {})

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        return main

    def __repr__(self):
        return "<Student(full_name='{}', school_id={}, user_id={})>"\
            .format(self.full_name, self.school_id, self.user_id)

class Stop(db.Model):
    __tablename__ = 'stops'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    location = db.Column(db.String())
    pickup_time = db.Column(db.Time())
    dropoff_time = db.Column(db.Time())
    route_id = db.Column(db.Integer, ForeignKey('routes.id'))
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())

    def as_dict(self):
        main = {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
        return main

    def __repr__(self):
        return "<Stop(name='{}', location='{}', route_id={}, latitude='{}', longitude='{})>"\
            .format(self.name, self.location, self.route_id, self.latitude, self.longitude)


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
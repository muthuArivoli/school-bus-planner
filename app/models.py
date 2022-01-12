from app import db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Date, Boolean

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
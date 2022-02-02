from flask.cli import FlaskGroup
import bcrypt
from app import app, db
from models import User


cli = FlaskGroup(app)


@cli.command("create_db")
def create_db():
    db.drop_all()
    db.create_all()
    db.session.commit()


@cli.command("seed_db")
def seed_db():
    password = 'AdminPassword'
    encrypted_pswd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = User(email='admin@gmail.com', full_name='Admin', pswd=encrypted_pswd.decode('utf-8'), admin_flag=1)
    db.session.add(new_user)
    db.session.commit()


if __name__ == "__main__":
    cli()
from flask.cli import FlaskGroup

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
    db.session.add(User(email='admin@gmail.com', full_name='Admin', pswd='AdminPassword', admin_flag=1))
    db.session.commit()


if __name__ == "__main__":
    cli()
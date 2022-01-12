from sqlalchemy import create_engine

engine = create_engine('postgres+psycopg2://postgres:bus@localhost:5000/db')

Base.metadata.create_all(engine)
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import crud

app = Flask(__name__)
app.config['SQLALCHEM_TRACK_MODIFICATIONS']
db = SQLAlchemy(app)

@app.route('/')
def hello_geek():
    return '<h1>Hello from Flask & Docker</h2>'

@app.route('/login')
def login():
    return 'Login now'

@app.route('/adminview')
def admin():
    return 'Admin'

if __name__ == "__main__":
    app.run(debug=True)
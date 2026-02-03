from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
import pandas as pd
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from pymongo import MongoClient
from bson import ObjectId

# AI Services (Updated to use Gemini)
from services.nlp_engine import NLPEngine
from services.alert_system import AlertSystem

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv', 'xlsx', 'xls'}
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# UPDATED CORS: Replace the URL with your actual Vercel deployment URL
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3000', 
    'https://feedback-analyzer-frontend.vercel.app' # Replace with your Vercel URL
])

# MongoDB Setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database()
users_col = db.users
feedback_col = db.feedback

# Initialize services
nlp_engine = NLPEngine()
alert_system = AlertSystem()

# Authentication decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = users_col.find_one({"_id": ObjectId(session['user_id'])})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    if users_col.find_one({"username": username}):
        return jsonify({'error': 'Username already exists'}), 400
    
    user_doc = {
        "username": username,
        "password_hash": generate_password_hash(data.get('password')),
        "role": data.get('role', 'student'),
        "student_id": data.get('student_id'),
        "faculty_id": data.get('faculty_id'),
        "name": data.get('name'),
        "classes": data.get('classes', ''),
        "created_at": datetime.utcnow()
    }
    result = users_col.insert_one(user_doc)
    user_doc['id'] = str(result.inserted_id)
    return jsonify({'success': True, 'user': username}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_col.find_one({"username": data.get('username')})
    if not user or not check_password_hash(user['password_hash'], data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = str(user['_id'])
    user_data = {
        "id": str(user['_id']),
        "username": user['username'],
        "role": user['role'],
        "student_id": user.get('student_id')
    }
    return jsonify({'success': True, 'user': user_data}), 200

@app.route('/api/feedback', methods=['POST'])
@login_required
def submit_feedback():
    data = request.get_json()
    feedback_text = data['feedback_text']
    analysis = nlp_engine.analyze_with_gemini(feedback_text)
    is_urgent = alert_system.check_urgent(feedback_text)
    
    feedback_doc = {
        'student_id': data.get('student_id', 'anonymous'),
        'class_name': data.get('class_name', ''),
        'instructor_id': data.get('instructor_id', ''),
        'feedback_type': data.get('feedback_type', 'campus'),
        'feedback_text': feedback_text,
        'category': analysis['category'],
        'sentiment': analysis['sentiment'],
        'sentiment_score': analysis['sentiment_score'],
        'suggestions': analysis['suggestions'],
        'is_urgent': is_urgent,
        'timestamp': datetime.utcnow()
    }
    
    feedback_col.insert_one(feedback_doc)
    return jsonify({'success': True, 'message': 'Feedback processed by AI'}), 201

@app.route('/api/feedback', methods=['GET'])
@login_required
def get_feedback():
    user = users_col.find_one({"_id": ObjectId(session['user_id'])})
    query = {}
    if user['role'] == 'faculty':
        query['instructor_id'] = str(user['_id'])
    
    feedbacks = list(feedback_col.find(query).sort("timestamp", -1))
    for f in feedbacks: f['id'] = str(f.pop('_id'))
    return jsonify({'success': True, 'feedbacks': feedbacks}), 200

if __name__ == '__main__':
    if not users_col.find_one({"username": "admin"}):
        users_col.insert_one({
            "username": "admin",
            "password_hash": generate_password_hash("admin123"),
            "role": "admin"
        })
    # Render requires the app to listen on a port provided by the environment
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, port=port, host='0.0.0.0')
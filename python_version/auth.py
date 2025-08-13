from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import base64
import time

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'fake_db.json')

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/auth', methods=['POST'])
def authenticate():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify({'success': False, 'message': 'Faltan credenciales'}), 400

        db = load_db()
        user = next((u for u in db['usuarios'] if u['email'] == email and u['password'] == password), None)
        if not user:
            return jsonify({'success': False, 'message': 'Credenciales incorrectas'}), 401

        token_data = {
            'id': user['id'],
            'email': user['email'],
            'exp': time.time() + 3600
        }
        token = base64.b64encode(json.dumps(token_data).encode('utf-8')).decode('utf-8')
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['nombre'],  # Cambiado de 'nombre' a 'name'
                'email': user['email']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
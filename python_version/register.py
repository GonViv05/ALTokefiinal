from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'fake_db.json')

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(db):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not all([data.get('name'), data.get('email'), data.get('password')]):
            return jsonify({'success': False, 'message': 'Faltan datos requeridos'}), 400

        db = load_db()
        usuarios = db['usuarios']

        if any(u['email'] == data['email'] for u in usuarios):
            return jsonify({'success': False, 'message': 'El correo ya está registrado'}), 400

        new_id = max((u['id'] for u in usuarios), default=0) + 1
        user = {
            "id": new_id,
            "nombre": data['name'],
            "email": data['email'],
            "password": data['password'],
            "telefono": data.get('phone', '')
        }

        usuarios.append(user)
        db['usuarios'] = usuarios
        save_db(db)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

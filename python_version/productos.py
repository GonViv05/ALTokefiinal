from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'fake_db.json')

DEFAULT_DB = {
    "usuarios": [],
    "productos": [],
    "carritos": []
}

def load_db():
    try:
        if not os.path.exists(DB_PATH):
            with open(DB_PATH, 'w', encoding='utf-8') as f:
                json.dump(DEFAULT_DB, f, ensure_ascii=False, indent=2)
            return DEFAULT_DB
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_DB

@app.route('/productos', methods=['GET'])
def get_productos():
    try:
        search = ((request.args.get('search')) or (request.args.get('q')) or '').lower()
        categoria = (request.args.get('categoria') or '').lower()
        proveedor = (request.args.get('proveedor') or '').lower()
        db = load_db()
        productos = db.get('productos', [])

        if search:
            productos = [p for p in productos if search in (p.get('nombre','').lower()) 
                         or search in (p.get('descripcion','').lower())]
        if categoria:
            productos = [p for p in productos if categoria in (p.get('categoria','').lower())]
        if proveedor:
            productos = [p for p in productos if proveedor == (p.get('proveedor','').lower())]

        # Asignar estrellas y reseñas aleatorias si no existen
        productos_with_rating = []
        for p in productos:
            prod = dict(p)  # copia para no modificar el original
            if 'valoracion' not in prod:
                prod['valoracion'] = round(random.uniform(3.0, 5.0), 1)
            if 'resenas' not in prod:
                prod['resenas'] = random.randint(5, 120)
            productos_with_rating.append(prod)

        return jsonify({'success': True, 'productos': productos_with_rating})
    except Exception as e:
        # Evitar 500 al frontend; devolver lista vacía
        return jsonify({'success': False, 'productos': [], 'message': str(e)}), 200

# Solo un bloque de arranque
if __name__ == '__main__':
    app.run(port=5000, debug=True)

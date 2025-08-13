from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import base64
import time
from functools import wraps

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'fake_db.json')

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(db):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace('Bearer ', '')
        if not token:
            return jsonify({'success': False, 'message': 'Token no proporcionado'}), 401
        try:
            decoded_token = base64.b64decode(token).decode('utf-8')
            payload = json.loads(decoded_token)
            if not payload or 'id' not in payload or payload['exp'] < time.time():
                return jsonify({'success': False, 'message': 'Token inválido o expirado'}), 401
            kwargs['user_id'] = payload['id']
        except Exception:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return decorated

def ensure_collections(db):
    # Make sure collections exist
    db.setdefault('carritos', [])
    db.setdefault('productos', [])
    db.setdefault('pedidos', [])
    return db

@app.route('/carrito', methods=['GET', 'POST', 'PUT', 'DELETE'])
@token_required
def carrito(user_id):
    db = ensure_collections(load_db())
    carritos = db['carritos']
    carrito = next((c for c in carritos if c['id_usuario'] == user_id), None)
    if not carrito:
        carrito = {'id_usuario': user_id, 'items': []}
        carritos.append(carrito)

    if request.method == 'GET':
        items = []
        for item in carrito['items']:
            prod = next((p for p in db['productos'] if p['id_producto'] == item['id_producto']), {})
            items.append({
                'id_item': item['id_item'],
                'id_producto': item['id_producto'],
                'nombre': prod.get('nombre', ''),
                'descripcion': prod.get('descripcion', ''),
                'precio': prod.get('precio', 0),
                'imagen': prod.get('imagen', ''),
                'proveedor': prod.get('proveedor', ''),
                'cantidad': item['cantidad']
            })
        return jsonify({'success': True, 'items': items, 'count': len(items)})

    elif request.method == 'POST':
        data = request.get_json() or {}
        prod_id = int(data.get('productoId', 0))
        cantidad = int(data.get('cantidad', 1))
        if prod_id <= 0:
            return jsonify({'success': False, 'message': 'Producto inválido'}), 400
        if cantidad < 1:
            return jsonify({'success': False, 'message': 'Cantidad inválida'}), 400

        # Validar que el producto exista
        producto = next((p for p in db['productos'] if p['id_producto'] == prod_id), None)
        if not producto:
            return jsonify({'success': False, 'message': 'El producto no existe'}), 404

        item = next((i for i in carrito['items'] if i['id_producto'] == prod_id), None)
        if item:
            item['cantidad'] += cantidad
        else:
            new_id = max([i['id_item'] for i in carrito['items']] + [0]) + 1
            carrito['items'].append({'id_item': new_id, 'id_producto': prod_id, 'cantidad': cantidad})
        save_db(db)
        return jsonify({'success': True, 'message': 'Producto agregado al carrito'})

    elif request.method == 'PUT':
        data = request.get_json() or {}
        item_id = int(data.get('itemId', 0))
        nueva_cantidad = int(data.get('nuevaCantidad', 0))
        item = next((i for i in carrito['items'] if i['id_item'] == item_id), None)
        if not item:
            return jsonify({'success': False, 'message': 'Ítem no encontrado'}), 404
        if nueva_cantidad < 1:
            return jsonify({'success': False, 'message': 'Cantidad inválida'}), 400
        item['cantidad'] = nueva_cantidad
        save_db(db)
        return jsonify({'success': True, 'message': 'Cantidad actualizada'})

    elif request.method == 'DELETE':
        data = request.get_json() or {}
        if 'itemId' in data:
            item_id = int(data['itemId'])
            carrito['items'] = [i for i in carrito['items'] if i['id_item'] != item_id]
            save_db(db)
            return jsonify({'success': True, 'message': 'Ítem eliminado'})
        else:
            carrito['items'] = []
            save_db(db)
            return jsonify({'success': True, 'message': 'Carrito vaciado'})

# Crear pedido (checkout) y listar/cancelar/reordenar pedidos
@app.route('/pedidos', methods=['GET', 'POST'])
@token_required
def pedidos(user_id):
    db = ensure_collections(load_db())
    carritos = db['carritos']
    pedidos = db['pedidos']
    productos = db['productos']
    carrito = next((c for c in carritos if c['id_usuario'] == user_id), {'items': []})

    if request.method == 'GET':
        # Listar pedidos del usuario (ordenados por id desc)
        user_orders = [p for p in pedidos if p['id_usuario'] == user_id]
        user_orders.sort(key=lambda x: x['id'], reverse=True)
        return jsonify({'success': True, 'orders': user_orders})

    # POST: Checkout -> crear pedido desde el carrito
    if not carrito['items']:
        return jsonify({'success': False, 'message': 'El carrito está vacío'}), 400

    new_id = max([p['id'] for p in pedidos] + [0]) + 1
    # snapshot de items
    order_items = []
    subtotal = 0
    for item in carrito['items']:
        prod = next((p for p in productos if p['id_producto'] == item['id_producto']), {})
        price = prod.get('precio', 0)
        order_items.append({
            'id_producto': item['id_producto'],
            'nombre': prod.get('nombre', ''),
            'imagen': prod.get('imagen', ''),
            'proveedor': prod.get('proveedor', ''),
            'precio': price,
            'cantidad': item['cantidad']
        })
        subtotal += price * item['cantidad']

    order = {
        'id': new_id,
        'id_usuario': user_id,
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'status': 'pending',
        'items': order_items,
        'shipping_cost': 0,
        'discount': 0,
        'subtotal': subtotal,
        'total': subtotal
    }
    pedidos.append(order)
    carrito['items'] = []
    save_db(db)
    return jsonify({'success': True, 'order': order, 'message': 'Pedido creado'})

@app.route('/pedidos/<int:pedido_id>', methods=['DELETE'])
@token_required
def cancelar_pedido(user_id, pedido_id):
    db = ensure_collections(load_db())
    pedidos = db['pedidos']
    pedido = next((p for p in pedidos if p['id'] == pedido_id and p['id_usuario'] == user_id), None)
    if not pedido:
        return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404

    # Soportar eliminación definitiva con ?hard=true o {"hard": true}
    try:
        data = request.get_json() or {}
    except Exception:
        data = {}
    hard = str(request.args.get('hard', '')).lower() in ('1', 'true', 'yes') or bool(data.get('hard'))

    if hard:
        db['pedidos'] = [p for p in pedidos if not (p['id'] == pedido_id and p['id_usuario'] == user_id)]
        save_db(db)
        return jsonify({'success': True, 'message': 'Pedido eliminado definitivamente'})

    # Cancelación (por defecto)
    if pedido['status'] in ['cancelled']:
        save_db(db)
        return jsonify({'success': True, 'message': 'Pedido ya estaba cancelado'})
    if pedido['status'] not in ['pending', 'processing']:
        return jsonify({'success': False, 'message': 'No se puede cancelar este pedido'}), 400
    pedido['status'] = 'cancelled'
    save_db(db)
    return jsonify({'success': True, 'message': 'Pedido cancelado'})

@app.route('/pedidos/<int:pedido_id>/reorden', methods=['POST'])
@token_required
def reorden_pedido(user_id, pedido_id):
    db = ensure_collections(load_db())
    pedidos = db['pedidos']
    carritos = db['carritos']
    pedido = next((p for p in pedidos if p['id'] == pedido_id and p['id_usuario'] == user_id), None)
    if not pedido:
        return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404

    carrito = next((c for c in carritos if c['id_usuario'] == user_id), None)
    if not carrito:
        carrito = {'id_usuario': user_id, 'items': []}
        carritos.append(carrito)

    # Añadir items del pedido al carrito
    for it in pedido['items']:
        existing = next((i for i in carrito['items'] if i['id_producto'] == it['id_producto']), None)
        if existing:
            existing['cantidad'] += it['cantidad']
        else:
            new_id = max([i['id_item'] for i in carrito['items']] + [0]) + 1
            carrito['items'].append({'id_item': new_id, 'id_producto': it['id_producto'], 'cantidad': it['cantidad']})

    save_db(db)
    return jsonify({'success': True, 'message': 'Productos añadidos al carrito'})
    
if __name__ == '__main__':
    app.run(port=5003, debug=True)
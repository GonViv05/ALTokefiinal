import sys
import os
import importlib

# Asegura que el directorio actual esté en sys.path para importar módulos locales
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Lista de módulos backend a controlar (usa el subdirectorio python_version)
MODULES = [
    "python_version.productos",   # productos.py
    "python_version.auth",        # auth.py
    "python_version.carrito",     # carrito.py
    "python_version.register",    # register.py
    # Agrega más módulos según tu estructura
]

def run_module(module_name):
    try:
        # Verifica si el archivo existe antes de importar
        parts = module_name.split('.')
        module_file = os.path.join(BASE_DIR, *parts) + '.py'
        if not os.path.isfile(module_file):
            print(f"Advertencia: {module_file} no encontrado. Saltando...")
            return

        module = importlib.import_module(module_name)
        # Ejecuta main() si existe
        if hasattr(module, "main"):
            print(f"Ejecutando {module_name}.main()")
            module.main()
        # Ejecuta app.run() si existe (por ejemplo, Flask/FastAPI)
        elif hasattr(module, "app") and hasattr(module.app, "run"):
            print(f"Ejecutando {module_name}.app.run()")
            module.app.run()
        else:
            print(f"{module_name} no tiene función main ni app.run()")
    except Exception as e:
        print(f"Error al iniciar {module_name}: {e}")

def main():
    print("Iniciando backend Altoke...")
    for mod in MODULES:
        run_module(mod)
    print("Backend Altoke lanzado.")

if __name__ == "__main__":
    main()

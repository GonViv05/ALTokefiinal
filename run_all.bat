@echo off
REM Activar entorno virtual (ajusta la ruta si tu env tiene otro nombre)
call env\Scripts\activate

REM Abrir puertos en el firewall de Windows para los servicios Flask
netsh advfirewall firewall add rule name="ALToke Productos 5000" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="ALToke Auth 5002" dir=in action=allow protocol=TCP localport=5002
netsh advfirewall firewall add rule name="ALToke Carrito 5003" dir=in action=allow protocol=TCP localport=5003
netsh advfirewall firewall add rule name="ALToke Register 5001" dir=in action=allow protocol=TCP localport=5001

REM Lanzar los servicios Flask en nuevas ventanas de terminal
start cmd /k "python python_version\productos.py"
start cmd /k "python python_version\auth.py"
start cmd /k "python python_version\carrito.py"
start cmd /k "python python_version\register.py"

REM Iniciar servidor HTTP para el frontend en el puerto 8080
start cmd /k "python -m http.server 8080 --bind 0.0.0.0"

REM Abrir el navegador en la página principal
start "" "http://localhost:8080/index.html"

echo Todos los servicios y el frontend han sido lanzados.
pause

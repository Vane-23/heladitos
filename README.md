# Heladitos - Sistema de Gestión de Heladería

Este es un proyecto desarrollado en **Node.js** con **Express** y **SQLite** para gestionar una heladería.  
Permite la administración de usuarios, sabores de helado y un carrito de compras.

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu_usuario/heladitos.git
cd heladitos
```
### 2. Instalar dependencias
Si usas yarn:
```
yarn install
```
Si usas npm:
```
npm install
```
### 3. Configuración de la base de datos
Al iniciar el servidor, si las tablas no existen, se crearán automáticamente.
Si deseas borrar la base de datos existente y generar una nueva:
```
rm database.sqlite
```
### 4. Iniciar el servidor
Para iniciar el servidor en modo desarrollador con **nodemon**
```
yarn nodemon
```
o con npm
```
npm nodemon
```
## 🔑 Credenciales de Acceso
Al ejecutar el sistema por primera vez, se creará automáticamente un usuario administrador con las siguientes credenciales:

* Email: helados@net.com
* Contraseña: Helados.1234

## 🔗 Tecnologías Usadas

* Node.js
* Express.js
* SQLite
* bcryptjs para encriptar contraseñas
* jsonwebtoken para autenticación
* multer para manejar imágenes
* Tailwind CSS para estilos
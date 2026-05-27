Debes tener node js instalado

Despues, en la terminal de vs abierta en la carpeta backend pon:
npm init -y


Debes crear un archivo llamado ".env" en la carpeta de tu backend, el archivo debe tener:
DATABASE_URL= enlaceHaciaTuBaseDeDatosDePostgresSQL
DATABASE_URL2= ElMismoEnlaceHaciaTuBaseDeDatosDePostgresSQL
JWT_SECRET=galleta_avena
JWT_EXPIRATION=8h
PORT=3000


Despues, en la terminal de vs en la carpeta de src ejecuta:
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
(Con eso crearas tus tablas de postgresSQL)


Para ejecutar tu backend, necesitas estar en con la tierminal en la carpeta src y poner:
node server.js


Para probar el frontend de momento tendras que instalar la extension de live server en vs code. Dale click derecho en frontend/html/login.html y dale a
abrir con live server, ahi para ingresar tendras que poner el usuario de prueba:
CI: 1234567LP
PASSWORD: admin123




Si quieres ver el index de empleado, en la base de datos tienes que cambiar el rol en vez de ADMIN a CAJERO y volver a realizar el login
npm i amqplib axios cors express mongodb reflect-metadata typeorm
npm i -D @types/amqplib @types/express @types/node nodemon typescript 
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
tsc

https://stackoverflow.com/questions/57848302/how-to-solve-command-find-requires-authentication-using-node-js-and-mongoose
use admin
db.createUser(
  {
    user: "root",
    pwd: "pass123",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
  }
)

#finally:
https://stackoverflow.com/questions/56795035/connecting-to-mongodb-atlas-with-typeorm
.env


# Initializing the repo

Go to the repositiory root and run ``` npm install ```

# Running the server

1. Install and run MongoDB. Define the database URL in an environment variable named MONGO_PATH.
Otherwise it will default to mongodb://localhost:27017/geocord

2. Define an environment variable named TEST if you want to generate random test data, otherwise it will look for data in database.

3. Define an environemtn variable named DEBUG with the value http if you want to print debug logs.

4. Go to the repository root and run ``` npm start ``` (if you have the environment variables in your $PATH, otherwise pass the appropriate variables with the command (e.g. ``` DEBUG=http TEST=1 MONGO_PATH = your_db_path npm start ``` ))

# Moving around

1. The logic for the router is in routers/geocord.js
2. The server file is in server/server.js
3. The db schema for ward is in models/ward_model.js 

If you are running test server, you'll be supplied random data. Thefinalised data will be available when the model is finalised and the frontend finalises the reponse structure.

# Using with docker
If the mongo docker is running, run 
``` 
docker ps 
``` 
And note the name of the mongo instance under NAMES column.
Then build this docker running
```
sudo docker build -t xpand .
```
Then run
```
sudo docker run -it --link mongo_name:mongo -p <port_of_host>:3000 -e MONGO_PATH=mongodb://mongo:27017/geocord xpand:latest
```
where mongo_name is the name of your mongo instance
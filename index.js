require("dotenv").config()

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const validator = require("email-validator");
const mongoose = require("mongoose");
var bodyParser = require('body-parser')
const toDoTask = require("./models/toDoTask");
const user = require("./models/user");
const {
        request
} = require("http");
const {
        response
} = require("express");
let loggedUser = "";

const app = express();
const host = process.env.HOST;
const port = process.env.PORT;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
        extended: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true
}, () => {
        console.log("Database connection established");
        app.listen(3000, () => console.log(`Server Started on http://${host}:${port}`));
});

app.use(express.static(path.join(__dirname, 'public')));

app.route('/').get((request, response) => {
        response.render('login.ejs');
});

app.route('/create').get((request, response) => {

        renderCreateUserEJS(response, "")
});

app.route('/auth').post(async (request, response) => {

        let authEmail = request.body.email;
        let authPassword = request.body.password;

        let authUser = await user.findOne({
                email: authEmail
        });
        if (authUser) {
                let hashedPassword = await bcrypt.compare(authPassword, authUser.password);
                if (hashedPassword) {
                        loggedUser = authUser.username;
                        renderTasks(response, "");
                }

        } else {
                renderCreateUserEJS(response, "")
        }
});

app.route('/register').post(async (request, response) => {
        const salt = await bcrypt.genSalt(10);

        let registerUsername = request.body.username;
        let registerPassword = await bcrypt.hash(request.body.password, salt);
        let registerEmail = "";

        if (validator.validate(request.body.email)) {
                registerEmail = request.body.email;
        } else {
                renderCreateUserEJS(response, "Email was not valid!")
        }

        let registerUser = new user({
                username: registerUsername,
                password: registerPassword,
                email: registerEmail
        });

        let authUser = await user.findOne({
                email: registerEmail
        });

        if (!authUser) {
                try {
                        await registerUser.save();
                        loggedUser = registerUsername;
                        renderTasks(response, "");
                } catch (err) {
                        renderCreateUserEJS(response, "User was not created!")
                }
        } else {
                renderCreateUserEJS(response, "User already exists!")
        }


});

app.route('/addToDo').post(async (request, response) => {
        let toDoContent = request.body.content;
        let toDoCreator = loggedUser;
        const createToDo = new toDoTask({
                content: toDoContent,
                creator: toDoCreator
        });

        try {
                await createToDo.save();
                renderTasks(response, "");
        } catch (err) {
                renderTasks(response, "Task was not created!");
        }
});

app.route("/edit/:id").get((request, response) => {
        const id = request.params.id;
        toDoTask.find({}, (err, tasks) => {
                response.render("todoUpdate.ejs", {
                        todoTasks: tasks,
                        taskId: id
                });
        });
}).post((request, response) => {
        const id = request.params.id;
        toDoTask.findByIdAndUpdate(id, {
                content: request.body.content
        }, err => {
                if (err)
                        return response.send(500, err);

                renderTasks(response, "");
        });
});

app.route("/remove/:id").get((request, response) => {
        const id = request.params.id;
        toDoTask.findByIdAndRemove(id, err => {
                if (err)
                        return response.send(500, err);

                renderTasks(response, "");
        });
});

function renderCreateUserEJS(response, message) {
        response.render("create.ejs", {
                message: message
        });
}

function renderTasks(response, message) {
        toDoTask.find({
                'creator': loggedUser
        }, (err, tasks) => {
                response.render("todo.ejs", {
                        result: tasks,
                        username: loggedUser,
                        message: message
                });
        });
}
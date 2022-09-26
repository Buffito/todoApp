require("dotenv").config()

const mongoose = require("mongoose");

const app = require('./app');

const host = process.env.HOST;
const port = process.env.PORT;

function main() {
        mongoose.connect(process.env.MONGO_URL, {
                useNewUrlParser: true
        }, () => {
                console.log("Database connection established");
                app.listen(3000, () => console.log(`Server Started on http://${host}:${port}`));
        });
}

main();
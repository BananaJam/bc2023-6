const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const bodyParser = require('body-parser');
const multer = require('multer');
const Ajv = require('ajv');
const validators = require('./validators.json');
const fs = require('fs');

const template = fs.readFileSync('template.html').toString();

const ajv = new Ajv({ useDefaults: true , removeAdditional: true});

const createValidator = ajv.compile(validators.createSchema);
const updateValidator = ajv.compile(validators.updateSchema);
const userValidator = ajv.compile(validators.userSchema);
const userUpdateValidator = ajv.compile(validators.userUpdateSchema);

const upload = multer({dest: 'uploads/'});

const port = 8000;

devices = [];

users = [];

app.use(bodyParser.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/images', express.static('uploads'));

//Devices

app.get('/devices', (req, res) => {
    res.status(200).send(devices);
});

app.get('/devices/:id', (req, res) => {
    temp = devices.filter((obj) => obj.id == req.params.id);
    if (temp.length == 0) {
        res.sendStatus(404);
    }else{
        res.status(200).send(temp);
    }
});

app.post('/devices', (req, res) => {
    if (createValidator(req.body)) {
        var obj = req.body;
        obj.id = devices.length;
        obj.assigned_to = null;
        devices.push(req.body);
        res.status(201).send(obj.id.toString());
    } else {
        res.sendStatus(400);
        console.log(ajv.errors);
    }
});

app.put('/devices/:id', (req, res) => {

    if (updateValidator(req.body)) {
        var temp = devices.filter((obj) => obj.id == req.params.id);

        if (temp.length != 0) {
            var obj = req.body;
            
            Object.keys(obj).forEach((key) => {
                if (obj[key] != null) {
                    devices[req.params.id][key] = obj[key];
                }
            })
            devices[req.params.id] = obj;
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(400);
        console.log(updateValidator.errors);
    }
});

app.delete('/devices/:id', (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.id);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        devices.splice(req.params.id, 1);
        res.sendStatus(200);
    }
});

app.put('/devices/:id/assign', (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.id);
    var user = users.filter((obj) => obj.username == req.body.username);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        if (temp[0].assigned_to == null && user.length != 0) {
            temp[0].assigned_to = req.body.username;
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    }
});

app.put('/devices/:id/unassign', (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.id);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        if (temp[0].assigned_to != null) {
            temp[0].assigned_to = null;
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    }
});

app.put('/devices/:id/image', upload.single('image'), (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.id);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        temp[0].image_path = req.file.filename;
        res.sendStatus(200);
    }
});

app.get('/devices/:id/image', (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.id);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        if (temp[0].image_path != null) {
            res.send(template.replace('{%image_path}', temp[0].image_path).replace('image_mimetype'));
        } else {
            res.sendStatus(404);
        }
    }
});

//Users

app.get('/users', (req, res) => {
    res.status(200).send(users);
});

app.post('/users', upload.array(), (req, res) => {
    if (userValidator(req.body)) {
        if (users.filter((obj) => obj.username == req.body.username).length != 0) {
            res.sendStatus(409);
            return;
        }
        users.push(req.body);
        res.status(201).send(req.body.username);
    } else {
        res.sendStatus(400);
        console.log(userValidator.errors);
    }
});

app.get('/users/:username', (req, res) => {
    temp = users.filter((obj) => obj.username == req.params.username);
    if (temp.length == 0) {
        res.sendStatus(404);
    }else{
        res.status(200).send(temp);
    }
});

app.put('/users/:username', (req, res) => {
    var temp = users.filter((obj) => obj.username == req.params.username);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        if (userUpdateValidator(req.body)) {
            Object.keys(req.body).forEach((key) => {
                if (req.body[key] != null) {
                    users[users.indexOf(temp[0])][key] = req.body[key];
                }
            })
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
            console.log(userValidator.errors);
        }
    }
});

app.delete('/users/:username', (req, res) => {
    var temp = users.filter((obj) => obj.username == req.params.username);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        users.splice(users.indexOf(temp[0]), 1);
        res.sendStatus(200);
    }
});

app.get('/users/:username/devices', (req, res) => {
    temp = devices.filter((obj) => obj.assigned_to == req.params.username);
    if (temp.length == 0) {
        res.sendStatus(404);
    }else{
        res.status(200).send(temp);
    }
});

app.listen(port, () => {
    console.log('http://localhost:' + port + '/api-docs');
});
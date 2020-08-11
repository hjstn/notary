const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const Sequelize = require('sequelize');

const Database = require('./core/Database');

const app = express();

const ENUMS = require('./models/Enums');

const config = require('./config');

const database = new Database();

app.use(expressSession({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    if (!('userID' in req.session)) return res.redirect('/login');

    res.sendFile(path.join(__dirname, 'public/home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) return res.sendStatus(400);

    database.models.User.findUsername(req.body.username).then(targetUser => {
        if (!targetUser || !targetUser.checkPassword(req.body.password)) return res.sendStatus(401);

        req.session.userID = targetUser.id;
        res.redirect('/');
    });
});

app.get('/logout', (req, res) => {
    if (!req.session || !('userID' in req.session)) return res.sendStatus(400);

    delete req.session.userID;

    res.redirect('/');
});

app.route('/book/:bookID?').get((req, res) => {
    // TODO
    res.sendFile('test.epub');
}).post((req, res) => {
    // TODO
    res.send('Upload book.');
}).delete((req, res) => {
    // TODO
    res.send('Delete book.');
});

app.route('/user/:userID?').get((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    const userID = req.params.userID ? req.params.userID : req.session.userID;

    database.models.User.findID(userID).then(targetUser => {
        if (!targetUser) return res.sendStatus(404);

        res.send(targetUser.getData());
    });
}).post((req, res) => {
    if (!req.body || !req.body.username || !req.body.password || !req.body.name || typeof req.body.username !== 'string' ||
        typeof req.body.password !== 'string' || typeof req.body.name !== 'string') return res.sendStatus(400);

    database.models.User.create({
        username: req.body.username,
        password: req.body.password,
        permission: ENUMS.PERMISSION.STUDENT,
        name: req.body.name
    }).then(user => {
        res.send(user.getData());
    }).catch(err => {
        if (err instanceof Sequelize.UniqueConstraintError) return res.sendStatus(406);
        
        return res.sendStatus(400);
    });
}).put((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    const userID = req.params.userID ? req.params.userID : req.session.userID;

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        const editUser = user => {
            if (req.body.username) user.username = req.body.username;
            if (req.body.password) user.password = req.body.password;
            if (req.body.name) user.name = req.body.name;

            return user.save().then(() => {
                res.sendStatus(200);
            });
        }

        if (actionUser.id === userID) {
            return editUser(actionUser);
        } else if (actionUser.getPermission() >= ENUMS.PERMISSION.ADMIN) {
            database.models.User.findID(userID).then(targetUser => {
                if (!targetUser) return res.sendStatus(404);

                return editUser(targetUser);
            });
        } else {
            res.sendStatus(401);
        }
    });
}).delete((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    const userID = req.params.userID ? req.params.userID : req.session.userID;

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        const deleteUser = user => {
            return user.destroy().then(() => {
                res.sendStatus(200);
            });
        }

        if (actionUser.id === userID) {
            return deleteUser(actionUser);
        } else if (actionUser.getPermission() >= ENUMS.PERMISSION.ADMIN) {
            database.models.User.findID(userID).then(targetUser => {
                if (!targetUser) return res.sendStatus(404);

                return deleteUser(targetUser);
            });
        } else {
            res.sendStatus(401);
        }
    });
});

app.route('/class/:classID?').get((req, res) => {
    if (!req.params || !req.params.classID) return res.sendStatus(401);

    database.models.Class.findID(req.params.classID).then(targetClass => {
        if (!targetClass) return res.sendStatus(404);

        targetClass.getData().then(classData => {
            res.send(classData);
        })
    });
}).post((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    if (!req.body || !req.body.name || typeof req.body.name !== 'string') return res.sendStatus(400);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.Class.create({
            name: req.body.name
        }).then(dbClass => {
            return dbClass.addUser(actionUser, { through: { permission: ENUMS.PERMISSION.TEACHER }}).then(async () => {
                return res.send(await dbClass.getData());
            });
        }).catch(err => {
            console.log(err);
            return res.sendStatus(400);
        });
    });
}).put((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.Class.findID(req.params.classID).then(async targetClass => {
            if (!targetClass) return res.sendStatus(404);

            if (await (actionUser.getPermissionForClass(targetClass.id)) >= ENUMS.PERMISSION.TEACHER) {
                if (req.body.name) targetClass.name = req.body.name;

                return targetClass.save().then(() => {
                    res.sendStatus(200);
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
}).delete((req, res) => {
    if (!req.session || !req.session.userID) return res.sendStatus(401);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.Class.findID(req.params.classID).then(async targetClass => {
            if (!targetClass) return res.sendStatus(404);

            if (await (actionUser.getPermissionForClass(targetClass.id)) >= ENUMS.PERMISSION.TEACHER) {
                if (req.body.name) targetClass.name = req.body.name;

                return targetClass.destroy().then(() => {
                    res.sendStatus(200);
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
});

app.route('/class/:classID/member/:userID?/:username?').post((req, res) => {
    if (!req.session || !req.session.userID || !req.params.classID || !req.params.userID || !req.params.username) return res.sendStatus(401);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.Class.findID(req.params.classID).then(async targetClass => {
            if (!targetClass) return res.sendStatus(404);

            if (await (actionUser.getPermissionForClass(targetClass.id)) >= ENUMS.PERMISSION.TEACHER) {
                const targetUser = await database.models.User.findID(req.params.userID);

                if (!targetUser || targetUser.username !== req.params.username) return res.sendStatus(400);

                return targetClass.addUser(targetUser, { through: { permission: ENUMS.PERMISSION.STUDENT }}).then(async () => {
                    return res.send(await targetClass.getData());
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
}).put((req, res) => {
    if (!req.session || !req.session.userID || !req.params.classID || !req.params.userID) return res.sendStatus(401);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.ClassUser.findClassUser(req.params.classID, req.params.userID).then(async classUser => {
            if (!classUser) return res.sendStatus(404);

            if (req.body.permission && await (actionUser.getPermissionForClass(req.params.classID)) >= ENUMS.PERMISSION.TEACHER)
                classUser.permission = req.body.permission;

            return classUser.save().then(() => {
                res.sendStatus(200);
            });
        }).catch(err => {
            res.sendStatus(400);
        });
    });
}).delete((req, res) => {
    if (!req.session || !req.session.userID || !req.params.classID) return res.sendStatus(401);

    database.models.User.findID(req.session.userID).then(actionUser => {
        if (!actionUser) {
            delete req.session.userID;
            return res.sendStatus(401);
        }

        database.models.Class.findID(req.params.classID).then(async targetClass => {
            if (!targetClass) return res.sendStatus(404);

            if (actionUser.id === req.params.userID) {
                return targetClass.removeUser(targetUser).then(() => {
                    res.sendStatus(200)
                });
            } else if (req.params.userID && await (actionUser.getPermissionForClass(targetClass.id)) >= ENUMS.PERMISSION.TEACHER) {
                const targetUser = await database.models.User.findID(req.params.userID);

                if (!targetUser) return res.sendStatus(400);

                return targetClass.removeUser(targetUser).then(() => {
                    res.sendStatus(200)
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
});

app.route('/class/:classID/book/:bookID/annotations/:userID').get((req, res) => {
    // TODO
    res.send('Get annotations');
}).post((req, res) => {
    // TODO
    res.send('Create annotations.');
}).put((req, res) => {
    // TODO
    res.send('Edit annotations.');
}).delete((req, res) => {
    // TODO
    res.send('Delete annotations');
});

app.listen(config.port, () => {
    console.log('Listening.');
});
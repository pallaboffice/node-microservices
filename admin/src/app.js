"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var typeorm_1 = require("typeorm");
var product_1 = require("./entity/product");
var amqp = require("amqplib/callback_api");
var business_admin_1 = require("./entity/business_admin");
//import { jwt } from 'jsonwebtoken';
var jwt = require('jsonwebtoken'); // Correct import
(0, typeorm_1.createConnection)().then(function (db) {
    var productRepository = db.getRepository(product_1.Product);
    var app = express();
    // Secret key for JWT
    var JWT_SECRET = 'yourSecretKey';
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
    }));
    app.use(express.json());
    //amqp.credentials.plain('guest','guest');
    //const amqp = require('amqplib');
    amqp.connect('amqp://localhost:5672', function (error0, connection) {
        if (error0) {
            console.error("[AMQP]", error0.message);
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            app.get('/api/products/:page/:limit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var page, limit, offset, _a, products, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            page = parseInt(req.params.page) || 1;
                            limit = parseInt(req.params.limit) || 6;
                            offset = (page - 1) * limit;
                            console.log(page, limit, offset);
                            return [4 /*yield*/, productRepository.findAndCount({
                                    skip: offset,
                                    take: limit,
                                    order: { id: "DESC" }, // Sort by latest created
                                })];
                        case 1:
                            _a = _b.sent(), products = _a[0], total = _a[1];
                            res.json({
                                total: total,
                                page: page,
                                limit: limit,
                                totalPages: Math.ceil(total / limit),
                                data: products,
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            app.post('/api/products', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.create(req.body)];
                        case 1:
                            product = _a.sent();
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            app.get('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, productRepository.findOne({ where: { id: parseInt(req.params.id, 10) } })];
                        case 1:
                            product = _a.sent();
                            if (!product) {
                                return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                            }
                            return [2 /*return*/, res.send(product)];
                        case 2:
                            error_1 = _a.sent();
                            console.error("Error fetching product:", error_1);
                            res.status(500).json({ error: "Internal server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.put('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.findOne({ where: { id: parseInt(req.params.id, 10) } })];
                        case 1:
                            product = _a.sent();
                            productRepository.merge(product, req.body);
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            app.delete('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.delete(req.params.id)];
                        case 1:
                            result = _a.sent();
                            channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            app.post('/api/products/:id/like', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, result, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, productRepository.findOne({ where: { id: parseInt(req.params.id, 10) } })];
                        case 1:
                            product = _a.sent();
                            if (!product) {
                                return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                            }
                            product.likes++;
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            result = _a.sent();
                            return [2 /*return*/, res.send(result)];
                        case 3:
                            error_2 = _a.sent();
                            console.error("Error fetching product:", error_2);
                            res.status(500).json({ error: "Internal server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            console.log('Listening to port: 8000');
            app.listen(8000);
            process.on('beforeExit', function () {
                console.log('closing');
                connection.close();
            });
        });
        //
        // admin user and authentication 
        //
        var BusinessAdminRepository = db.getRepository(business_admin_1.BusinessAdmin);
        app.get('/api/business_user', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var business_admin, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, BusinessAdminRepository.find()];
                    case 1:
                        business_admin = _a.sent();
                        res.json(business_admin);
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error fetching users:", error_3);
                        res.status(500).json({ error: "Internal server error" });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        app.post('/api/business_user', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var business_admin, result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, BusinessAdminRepository.create(req.body)];
                    case 1:
                        business_admin = _a.sent();
                        return [4 /*yield*/, BusinessAdminRepository.save(business_admin)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, res.send(result)];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Error fetching users:", error_4);
                        res.status(500).json({ error: "Internal server error" });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //Validate truthy using if(value) only
        //        ╭─ nullish ──────╮ ╭─ not nullish ─────────────────────────────────╮
        //        ┌───────────┬──────┬───────┬───┬────┬─────┬──────┬───┬─────────┬─────┐
        //        │ undefined │ null │ false │ 0 │ "" │ ... │ true │ 1 │ "hello" │ ... │
        //        └───────────┴──────┴───────┴───┴────┴─────┴──────┴───┴─────────┴─────┘
        //         ╰─ falsy ───────────────────────────────╯ ╰─ truthy ───────────────╯
        //validate client side json request
        //https://stackoverflow.com/questions/28286073/test-how-api-handles-invalid-json-syntax-request-body-using-node-js
        //validate servreside json
        app.use(function (err, req, res, next) {
            if (err.status === 400) {
                return res.status(400).send({ status: 400, message: err.message });
            }
            if (err instanceof SyntaxError && 'body' in err) {
                console.error(err.name);
                return res.status(400).send({ status: 400, message: err.message }); // Bad request
            }
            next();
        });
        function validateJson(jsonData) {
            if (typeof jsonData !== 'object') {
                return false;
            }
            try {
                var json_data = JSON.stringify(jsonData);
                if (json_data.length < 10) {
                    throw Error('Please connect to admin!');
                }
            }
            catch (error) {
                console.log("Invalid data!", error);
                return false;
            }
            return true;
        }
        app.post('/api/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var user, email, token, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validateJson(req.body)) {
                            return [2 /*return*/, res.status(404).json({ error: "Invalid data!" })];
                        }
                        if (req.body.email_address && req.body.password) {
                            console.log("Login: ", req.body.email_address, req.body.password);
                        }
                        else {
                            return [2 /*return*/, res.status(404).json({ error: "Verify username or password!" })];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BusinessAdminRepository.find({
                                where: {
                                    email_address: req.body.email_address,
                                    password: req.body.password
                                },
                                select: {
                                    bid: true
                                }
                            })];
                    case 2:
                        user = _a.sent();
                        if (!user[0]) {
                            return [2 /*return*/, res.status(404).json({ error: "Invalid username or password!" })];
                        }
                        try {
                            email = req.body.email_address;
                            token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: '1h' });
                            res.status(200).json({
                                message: "Login Successful",
                                token: token
                            });
                        }
                        catch (error) {
                            console.error("Error generating JWT:", error);
                            res.status(500).json({ message: 'Error generating token', error: error.message });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Error:", error_5);
                        res.status(500).json({ error: "Internal server error" });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        //After login success, load dashborad , pages
        // Middleware to verify JWT token
        var verifyToken = function (req, res, next) {
            var _a;
            // Get the token from the Authorization header
            var token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ message: 'Access Denied. No token provided.' });
            }
            try {
                // Verify the token
                var decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded; // Store the decoded user information in the request object
                next(); // Proceed to the next middleware or route handler
            }
            catch (err) {
                res.status(400).json({ message: 'Invalid token' });
            }
        };
        // Dashboard Route (Protected)
        app.get('/dashboard', verifyToken, function (req, res) {
            // Access the user data from the JWT token
            var userEmail = req.body.email_address;
            // Send a response for the protected dashboard
            res.status(200).json({
                message: "Welcome to the dashboard, ".concat(userEmail),
            });
        });
        //curl -X GET http://localhost:3000/dashboard -H "Authorization: Bearer <your_jwt_token>"
    });
});

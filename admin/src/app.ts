import * as express from 'express'
import {Request, Response} from 'express'
import * as cors from 'cors'
import {createConnection} from 'typeorm'
import {Product} from "./entity/product";
import * as amqp from 'amqplib/callback_api';
import { BusinessAdmin } from './entity/business_admin';
//import { jwt } from 'jsonwebtoken';

const jwt = require('jsonwebtoken'); // Correct import

createConnection().then(db => {
    const productRepository = db.getRepository(Product);

    const app = express()

    // Secret key for JWT
    const JWT_SECRET = 'yourSecretKey';

    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
    }))

    app.use(express.json())

    //amqp.credentials.plain('guest','guest');
    //const amqp = require('amqplib');
    amqp.connect('amqp://localhost:5672', (error0, connection) => {
        if (error0) {
            console.error("[AMQP]", error0.message);
            throw error0
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1
            }

            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find()
                res.json(products)
            })

            app.post('/api/products', async (req: Request, res: Response): Promise<any> => {
                const product = await productRepository.create(req.body);
                const result = await productRepository.save(product)
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            })

            app.get('/api/products/:id', async (req: Request, res: Response): Promise<any> => {
                    try{
                        const product = await productRepository.findOne({where: {id: parseInt(req.params.id, 10)}})
                        if (!product) {
                            return res.status(404).json({ error: "Product not found" });
                          }
                        return res.send(product)
                    }catch(error){
                        console.error("Error fetching product:", error);
                        res.status(500).json({ error: "Internal server error" });
                    }
            });

            app.put('/api/products/:id', async (req: Request, res: Response): Promise<any> => {
                const product = await productRepository.findOne({where: {id:  parseInt(req.params.id, 10)}})
                productRepository.merge(product, req.body)
                const result = await productRepository.save(product)
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            });

            app.delete('/api/products/:id', async (req: Request, res: Response): Promise<any> => {
                const result = await productRepository.delete(req.params.id)
                channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
                return res.send(result)
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response): Promise<any> => {
                try{
                    const product = await productRepository.findOne({where: {id:  parseInt(req.params.id, 10)}})
                    if (!product) {
                        return res.status(404).json({ error: "Product not found" });
                      }
                    product.likes++
                    const result = await productRepository.save(product)
                    return res.send(result)
                }catch(error){
                    console.error("Error fetching product:", error);
                    res.status(500).json({ error: "Internal server error" });
                }
            })

            console.log('Listening to port: 8000')
            app.listen(8000)
            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
        
        //
        // admin user and authentication 
        //
        const BusinessAdminRepository = db.getRepository(BusinessAdmin);

        app.get('/api/business_user', async (req: Request, res: Response): Promise<any> => {
            try{
                const business_admin = await BusinessAdminRepository.find()
                res.json(business_admin)
            }catch(error){
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        })

        app.post('/api/business_user', async (req: Request, res: Response): Promise<any> => {
            try{
                const business_admin = await BusinessAdminRepository.create(req.body);
                //console.log(req.body);
                //console.log(business_admin);
                const result = await BusinessAdminRepository.save(business_admin)
                return res.send(result)
            }catch(error){
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        })

//Validate truthy using if(value) only
//        ╭─ nullish ──────╮ ╭─ not nullish ─────────────────────────────────╮
//        ┌───────────┬──────┬───────┬───┬────┬─────┬──────┬───┬─────────┬─────┐
//        │ undefined │ null │ false │ 0 │ "" │ ... │ true │ 1 │ "hello" │ ... │
//        └───────────┴──────┴───────┴───┴────┴─────┴──────┴───┴─────────┴─────┘
//         ╰─ falsy ───────────────────────────────╯ ╰─ truthy ───────────────╯
 
//validate client side json request
//https://stackoverflow.com/questions/28286073/test-how-api-handles-invalid-json-syntax-request-body-using-node-js

//validate servreside json


        app.use((err, req, res, next) => {
            if(err.status === 400){return res.status(400).send({ status: 400, message: err.message });}
            if (err instanceof SyntaxError && 'body' in err) {
                console.error(err.name);
                return res.status(400).send({ status: 400, message: err.message }); // Bad request
            }
            next();
        })


        function validateJson(jsonData){
            if(typeof jsonData !== 'object'){return false;}

            try{
                const json_data = JSON.stringify(jsonData);
                if(json_data.length < 10){ throw Error('Please connect to admin!')}
            }catch(error){
                console.log("Invalid data!",error);
                return false;
            }
            return true;
        }
        
        app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
            if(!validateJson(req.body)){
                return res.status(404).json({ error: "Invalid data!" });
            }
            if(req.body.email_address && req.body.password){
                console.log("Login: ",req.body.email_address,req.body.password);
            }else{
                return res.status(404).json({ error: "Verify username or password!" });
            }
            try{
                const user = await BusinessAdminRepository.find({
                    where : {
                        email_address: req.body.email_address,
                        password: req.body.password
                    },
                    select: {
                        bid:true
                    }
                })
                
                if (!user[0]) {
                    return res.status(404).json({ error: "Invalid username or password!" });
                  }
                try{
                        // Step 3: Generate a JWT token (optional: set expiration and user data)
                        const email = req.body.email_address;
                        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

                        res.status(200).json({
                            message: "Login Successful",
                            token: token
                        })
                }catch(error){
                    console.error("Error generating JWT:", error);
                    res.status(500).json({ message: 'Error generating token', error: error.message });
                }
                
            }catch(error){
                console.error("Error:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        })

        //After login success, load dashborad , pages
        // Middleware to verify JWT token
            const verifyToken = (req, res, next) => {
                // Get the token from the Authorization header
                const token = req.header('Authorization')?.replace('Bearer ', '');

                if (!token) {
                    return res.status(401).json({ message: 'Access Denied. No token provided.' });
                }

                try {
                    // Verify the token
                    const decoded = jwt.verify(token, JWT_SECRET);
                    req.user = decoded;  // Store the decoded user information in the request object
                    next();  // Proceed to the next middleware or route handler
                } catch (err) {
                    res.status(400).json({ message: 'Invalid token' });
                }
            };

            // Dashboard Route (Protected)
            app.get('/dashboard', verifyToken, (req, res) => {
                // Access the user data from the JWT token
                const userEmail = req.body.email_address;

                // Send a response for the protected dashboard
                res.status(200).json({
                    message: `Welcome to the dashboard, ${userEmail}`,
                });
            });
            //curl -X GET http://localhost:3000/dashboard -H "Authorization: Bearer <your_jwt_token>"


    })
})

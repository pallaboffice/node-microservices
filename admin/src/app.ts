import * as express from 'express'
import {Request, Response} from 'express'
import * as cors from 'cors'
import {createConnection} from 'typeorm'
import {Product} from "./entity/product";
import * as amqp from 'amqplib/callback_api';

createConnection().then(db => {
    const productRepository = db.getRepository(Product);

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

            const app = express()

            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }))

            app.use(express.json())

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

            // app.put('/api/products/:id', async (req: Request, res: Response): Promise<any> => {
            //     const product = await productRepository.findOne(req.params.id)
            //     productRepository.merge(product, req.body)
            //     const result = await productRepository.save(product)
            //     channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
            //     return res.send(result)
            // });

            // app.delete('/api/products/:id', async (req: Request, res: Response): Promise<any> => {
            //     const result = await productRepository.delete(req.params.id)
            //     channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
            //     return res.send(result)
            // })

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
    })
})

// ESM
//import { faker } from '@faker-js/faker';
import {createConnection} from 'typeorm'
import {Product} from "./entity/product";

// CJS
const { faker } = require('@faker-js/faker');
const moment = require('moment');

export function createRandomProduct() {

    const date = moment(faker.date.past(), 'YYYY-MM-DDTHH:mm:ssZ');
    const isoString = date.toISOString();
    const res = isoString.substring(0, 19).replace('T', ' ');

  return {
    title: faker.commerce.productName(),
    image: faker.image.url(),
    price: faker.commerce.price(),
    description: faker.commerce.productDescription(),
    likes: faker.number.int({min:0, max:100}),
    created_at: res
  }
}

export const FakeProducts = faker.helpers.multiple(createRandomProduct, {count: 5000});
//console.log("okkkkkk");


createConnection().then(db => {
    const inFun = async (FakeProducts): Promise<any> => {
                const productRepository = db.getRepository(Product);
                console.log(FakeProducts);
                const prod = await productRepository.create(FakeProducts);
                const result = await productRepository.save(prod)
                console.log(result);
    }
    inFun(FakeProducts);
});
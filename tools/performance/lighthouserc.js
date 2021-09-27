const process = require('process');

if (!process.env.ARG) process.env.ARG = process.argv.pop().replace('--', '');

module.exports = {
    ci: {
        collect: {
            numberOfRuns: 3,
            url: [
                `http://lighthouse-ecommerce.herokuapp.com/?stage_tag=${process.env.ARG}`,
                `http://lighthouse-ecommerce.herokuapp.com/category/jewelry?stage_tag=${process.env.ARG}`,
                `http://lighthouse-ecommerce.herokuapp.com/product/7?stage_tag=${process.env.ARG}`,
                `http://lighthouse-ecommerce.herokuapp.com/cart?stage_tag=${process.env.ARG}`,
                `http://lighthouse-ecommerce.herokuapp.com/checkout?stage_tag=${process.env.ARG}`
            ],
            settings: {
                preset: 'desktop',
                output: 'json',
                maxWaitForLoad: 10000,
                chromeFlags: '--no-sandbox --disable-storage-reset --disable-dev-shm-usage --in-process-gpu'
            }
        },
        upload: {
            target: 'temporary-public-storage'
        }
    }
};

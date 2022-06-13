import express from 'express';
import cors from 'cors';
import {readFileSync} from 'fs'
import NodeBundlr from '@bundlr-network/client'
import multer from 'multer';

/*
    Multer is used to get the file that was posted from frontend
    and then to turn it into a buffer. Multer saves the file
    somewhere, so multer.memoryStorage() saves it in
    memory which is then deleted later.
*/

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const key = JSON.parse(readFileSync("./wallet.json").toString());

/*
    Bundlr has 2 nodes to create competition. Before uploading a file,
    the prices of the nodes are obtained to determine which one 
    costs the least to upload upon.
*/

async function getNodeOnePrice() {
    const response = await fetch ("https://node1.bundlr.network/price/1000");
    const price = await response.json();
    return price;
}

async function getNodeTwoPrice() {
    const response = await fetch ("https://node2.bundlr.network/price/1000");
    const price = await response.json();
    return price;
}

const app = express();
app.use(cors());

app.post('/', upload.any(), async (req, res) => {
    const time = new Date();
    const node1 = await getNodeOnePrice();
    const node2 = await getNodeTwoPrice();
    const nodeURL = node1 > node2 ? "https://node2.bundlr.network/price/1000" : "https://node1.bundlr.network/price/1000";

    /* The currency to be used can be specified. Other currencies have faster transactions, so
           it could be better to switch to a different wallet.
    */
    const bundlr = new NodeBundlr.default(nodeURL, 'arweave', key);

    const file = req.files[0];

    /* Balance is given in Winston where 10^12 Winston = 1 AR. */
    const balance = (await bundlr.getLoadedBalance()) / Math.pow(10,12);

    /* Price is similarly given in Winston. The transaction size is about 1000-2000 bytes larger than the file size */
    const price = await bundlr.getPrice(file.size + 2000) / Math.pow(10,12);
    
    if (price > balance) {
        /* 
            The wallet can be funded with the async function bundlr.fund(). The amount funded should
            be given in Winston as well. It can take up to an hour for the funds to actually get transferred. 
        */
        const endTime = new Date()
        res.json({message: `The file upload costs ${price} AR, but the wallet only has ${balance} AR available.`, time: time - endTime})
    } else { 

        /* Tags are needed to specify how the file is uploaded on the Arweave permaweb */
        const tags = [{ name: "Content-Type", value: file.mimetype}];
        const tx = bundlr.createTransaction(file.buffer, {tags});

        await tx.sign();
        const id = tx.id;
        await tx.upload();

        /* The location of the file on the arweave permaweb is given by https://arweave.net/tx.id */
        res.json({message: `The file upload costed ${price} AR. You have ${balance} AR remaining.`, id: id});
    }

})


app.listen(5000);
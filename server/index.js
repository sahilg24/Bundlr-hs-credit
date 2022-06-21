import express from 'express';
import cors from 'cors';
import {readFileSync} from 'fs'
import NodeBundlr from '@bundlr-network/client'
import multer from 'multer';


/* If you want to locally save files using the multer middleware, you can do this.
   However, if you use disk storage, the file buffer is no longer provided, so 
   you have to reread the file or obtain/pass the buffer in some other way in order
   to use Bundlr.

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './files');
    },
    filename: (req, file, cb) => {
        cb (null, file.originalname);
    }
})

*/


/*
    Multer is used to get the file that was posted from frontend
    and then to turn it into a buffer. Multer saves the file
    somewhere, so multer.memoryStorage() saves it in
    memory which is then deleted later.
*/

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

const key = JSON.parse(readFileSync("./wallet.json").toString());

/*
    Bundlr has 2 nodes to create competition. Before uploading a file,
    the prices of the nodes are obtained to determine which one 
    costs the least to upload upon.
*/
async function getCheapestNode() {
    const node1 = await fetch ("https://node1.bundlr.network/price/1000");
    const node2 = await fetch ("https://node2.bundlr.network/price/1000");
    const node1Price = await node1.json();
    const node2Price = await node2.json();
    const nodeURL = node1Price > node2Price ? "https://node2.bundlr.network/price/1000" : "https://node1.bundlr.network/price/1000";

    return nodeURL;
}

async function canFund (fileSize) {
    const nodeURL = await getCheapestNode();
    const bundlr = new NodeBundlr.default(nodeURL, 'arweave', key);
    /* 
        Balance is given in Winston where 10^12 Winston = 1 AR. 
        To fund, you can do await bundlr.fund(winston_amount)
    */
    const balance = ((await bundlr.getLoadedBalance()) / Math.pow(10,12)).toFixed(8);

    /* Price is similarly given in Winston. The transaction size is about 1000-2000 bytes larger than the file size */
    const price = ((await bundlr.getPrice(parseInt(fileSize) + 2000)) / Math.pow(10,12)).toFixed(8);

    if (price > balance) {
        return {success: false, price, balance};
    } else {
        return {success: true, price, balance, bundlr};
    }

}

const app = express();
app.use(cors());

/*  
    Sending the formdata from the frontend to the backend takes a while. So, if the user
    has insufficient funds, only the file size is sent and that can quickly inform the user 
    if they have enough funds.
*/

app.post ('/funds/:size', async (req, res) => {
    const funds = await canFund(req.params.size)
    if (!funds.success) {
        res.json({message: `The file upload costs ${funds.price} AR, but the wallet only has ${funds.balance} AR available.`, success: false})
    } else {
        res.json({success: true})
    }

})

app.post('/', upload.any(), async (req, res) => {
    const file = req.files[0];

    /* This is recalculated in case there was a sudden spike/dip in node prices. */
    const funds = await canFund(file.size);

    const bundlr = funds.bundlr;
    if (funds.balance > funds.price) {
        /* Tags are needed to specify how the file is uploaded on the Arweave permaweb */
        const tags = [{ name: "Content-Type", value: file.mimetype}];
        const tx = bundlr.createTransaction(file.buffer, {tags});
        await tx.sign();
        const id = tx.id;
        await tx.upload();

        /* The location of the file on the arweave permaweb is given by https://arweave.net/tx.id */
        res.json({message: `The file upload costed ${funds.price} AR. You have ${funds.balance - funds.price} AR remaining.`, id: id});
        
    } else {
        res.json({message: `The file upload costs ${funds.price} AR, but the wallet only has ${funds.balance} AR available.`})
    }

})


app.listen(5000);
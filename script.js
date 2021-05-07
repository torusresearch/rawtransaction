// taken from https://gist.github.com/raineorshine/c8b30db96d7532e15f85fcfe72ac719c
const Web3 = require("web3");
const Tx = require("ethereumjs-tx").Transaction;
const Torus = require("@toruslabs/torus-embed");
const torus = new Torus();

(async () => {
  await torus.init({
    network: {
      host: "rinkeby",
    },
  });
  await torus.login();

  // connect to Infura node
  const web3 = new Web3(torus.ethereum);

  const accounts = await web3.eth.getAccounts();
  const addressFrom = accounts[0];
  const addressBalance = await web3.eth.getBalance(accounts[0]);
  window.alert(addressFrom);
  window.alert(addressBalance);

  // the destination address
  const addressTo = addressFrom;

  // construct the transaction data
  // NOTE: property 'nonce' must be merged in from web3.eth.getTransactionCount
  // before the transaction data is passed to new Tx(); see sendRawTransaction below.
  const txData = {
    gasLimit: web3.utils.toHex(80000),
    gasPrice: web3.utils.toHex(1e9), // 1 Gwei
    to: addressTo,
    value: "0x0", // thanks @abel30567
    // if you want to send raw data (e.g. contract execution) rather than sending tokens,
    // use 'data' instead of 'value' (thanks @AlecZadikian9001)
    // e.g. myContract.methods.myMethod(123).encodeABI() (thanks @NguyenHoangSon96)
  };

  /** Signs the given transaction data and sends it. Abstracts some of the details of
   * buffering and serializing the transaction for web3.
   * @returns A promise of an object that emits events: transactionHash, receipt, confirmaton, error
   */
  const sendRawTransaction = async (txData) => {
    // get the number of transactions sent so far so we can create a fresh nonce
    const txCount = await web3.eth.getTransactionCount(addressFrom);
    console.log("WHAT THE NONCE", txCount);
    const newNonce = web3.utils.toHex(txCount);
    const transaction = new Tx({ ...txData, nonce: newNonce }, {chain:'rinkeby'}); // or 'rinkeby'
    // const transaction2 = new Tx({ ...txData, nonce: newNonce }, { chain: "mainnet" }); // or 'rinkeby'

    transaction.v = new Buffer([])
    transaction.s = new Buffer([])
    transaction.r = new Buffer([])
    const hash = transaction.hash(false);
    console.log("HASH IS", hash.toString('hex'))
    const result = await new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(
        {
          method: "eth_sign",
          params: [addressFrom, "0x"+hash.toString('hex')],
          jsonrpc: "2.0",
          id: new Date().getTime(),
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
    const vrs = Buffer.from(result.result.replace("0x", ""), "hex");
    const sig = {};
    sig.v = vrs.slice(64, 65)[0];
    sig.r = vrs.slice(0, 32);
    sig.s = vrs.slice(32, 64);
    if (transaction._implementsEIP155()) {
      sig.v += transaction.getChainId() * 2 + 8;
    }
    Object.assign(transaction, sig);

    try {
      console.log("t1", transaction.serialize().toString("hex"));
    } catch (err) {
      console.error(err);
    }

    // const privateKey = Buffer.from("", "hex")
    // transaction2.sign(privateKey)
    // console.log('t2', transaction2.serialize().toString('hex'))
    // throw new Error("break here")
    return web3.eth.sendSignedTransaction("0x" + transaction.serialize().toString("hex"));
  };

  // fire away!
  // (thanks @AndreiD)
  const result = await sendRawTransaction(txData);

  window.alert("finally here", result)
})();

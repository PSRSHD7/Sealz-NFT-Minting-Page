const Web3Modal = window.Web3Modal.default;

Notiflix.Notify.init({
	position: 'right-top',
})

let web3, provider, selectedAccount, accountData, contract;
let supplyInterval, supplyElement;

const providerOptions = {
	walletconnect: {
		package: window.WalletConnectProvider.default,
		options: {
			infuraId: "24fc637f581e49f7815d171634002d2d",
		}
	},
};

const web3Modal = new Web3Modal({
	network: "mainnet", // optional
	cacheProvider: false, // optional
	providerOptions,
	disableInjectedProvider: false,
});

let getAccountData = async () => {
	const chainId = await web3.eth.getChainId()
	const chainData = evmChains.getChain(chainId)
	const accounts = await web3.eth.getAccounts()
	selectedAccount = accounts[0]
	const bal = await web3.eth.getBalance(selectedAccount)
	const eth_bal = web3.utils.fromWei(bal, "ether")
	const human_bal = parseFloat(eth_bal).toFixed(4)
	return { account: selectedAccount, balance: bal, eth_balance: eth_bal, human_balance: human_bal, chain_id: chainId }
}

let verifySetup = async () => {
	console.log(accountData.chain_id, config)
	if(accountData.chain_id != config.requirements.chain_id) {
		Notiflix.Notify.failure('Wrong Chain ID! Switch to ETH Mainnet.');
	}
}

let connectWallet = async () => {
	try {
		provider = await web3Modal.connect();
		web3 = new Web3(provider)
		contract = new web3.eth.Contract(abi, config.contract.contract_address)
		getTotalSupplyInterval()
		supplyInterval = setInterval(getTotalSupplyInterval, 10000)
	} catch(e) {
		console.log(e)
		if(e) Notiflix.Notify.failure(e);
		return
	}
	accountData = await getAccountData()
	await verifySetup()
	console.log(accountData)
	provider.on("accountsChanged", async (accounts) => {
		if(accounts.length == 0) return;
		accountData = await getAccountData()
		await verifySetup()
		console.log(accountData)
	})
	provider.on("chainChanged", async (accounts) => {
		if(accounts.length == 0) return;
		accountData = await getAccountData()
		await verifySetup()
		console.log(accountData)
	})
	Notiflix.Notify.success('Connected Wallet');
}

let total_amt;
let getTotalSupplyInterval = async () => {
	if(!contract) return;
	let res;
	try {
		res = await contract.methods.totalSupply().call()
	} catch(e) {
		return
	}
	if(res) {
		console.log('total supply', res)
		if(supplyElement) { 
			console.log(total_amt)
			if(total_amt) {
				supplyElement.innerText = `Amount minted: ${res} / ${total_amt}`
			} else {
				supplyElement.innerText = `Amount minted: ${res}`
			}
		}
	}
}

mintIsActive = false
let getIsMintActive = async () => {
	if(!contract) return;
	let res;
	try {
		res = await contract.methods.mintIsActive().call()
		mintIsActive = res
		return res
	} catch(e) {
		console.log(e)
	}
}

let registerSupplyElement = async (element, total_amt_) => {
	console.log(total_amt)
	supplyElement = element
	total_amt = total_amt_
	getTotalSupplyInterval()
}

let registerConnectButton = async (element) => {
	element.addEventListener('click', connectWallet)
}

let registerMintButton = async (element, amt_element) => {
	element.addEventListener('click', async () => {
		/*let isMintActive = await getIsMintActive()
		console.log(isMintActive)
		if(!isMintActive) {
			Notiflix.Notify.failure("Mint is not active yet!")
			return
		}*/
		await contract.methods[config.contract.mint_function](amt_element.value).send({
			from: accountData.account,
			value: amt_element.value * config.contract.mint_price
		})
			.on('transactionHash', (hash) => {
				Notiflix.Notify.success("Transaction Sent!");
			})
			.on('confirmed', (receipt) => {
				Notiflix.Notify.success("Transaction Confirmed!");
			})
			.on('error', (error, receipt) => {
				Notiflix.Notify.failure(error.message);
			})
	})
}

let registerContractButton = async (element, address, abi, method, params, cb) => {
	element.addEventListener('click', async () => {
		params = params || null;
		console.log(params.value)
		let contract = new web3.eth.Contract(abi, address)
		let res = await contract.methods[method]().call()
		console.log(res)
		if(cb) { return cb(res) }
	});
	//element.addEventListener('click', connectWallet)
}

window.addEventListener('load', connectWallet)

import React, { useState, useEffect, useCallback } from 'react';
import Exchange from './Exchange.json';
import { ethers } from "ethers";
import './App.css';
import USDC_ABI from "./USDC.json"
import INRC_ABI from "./INRC.json"

function App() {
    let contractAddress = "0x4f5c8893c2bA93c6E93373542FbCEc14506752ED"; //rinkeby
    let USDCContract = "0x157Cf26Cf30e9Df3936643883565AcF62cd416E9";
    let INRCContract = "0xedd38dA636C86CCc876e62B7B7e23e85f8E3377B";

    let [blockchainProvider, setBlockchainProvider] = useState(undefined);
    let [metamask, setMetamask] = useState(undefined);
    let [metamaskNetwork, setMetamaskNetwork] = useState(undefined);
    let [metamaskSigner, setMetamaskSigner] = useState(undefined);
    const [networkId, setNetworkId] = useState(undefined);
    const [loggedInAccount, setAccounts] = useState(undefined);
    const [etherBalance, setEtherBalance] = useState(undefined);
    const [isError, setError] = useState(false);

    const [contract, setReadContract] = useState(null);
    const [writeContract, setWriteContract] = useState(null);
    const [USDC, setUSDC] = useState(null);
    const [USDC2, setUSDC2] = useState(null);
    const [INRC, setINRC] = useState(null);
    const [INRC2, setINRC2] = useState(null);

    const [inrBal, setInrBal] = useState(null);
    const [USDCBal, setUSDCBal] = useState(null);
    const [tokenInput, setTokenInput] = useState(null);
    const [tokenInput2, setTokenInput2] = useState(null);
    const [tokenInput3, setTokenInput3] = useState(null);
    const [address, setAddress] = useState(null);
    const [address2, setAddress2] = useState(null);
    const [displayFees, setDisplayFees] = useState(null);


    let alertMessage;

    const connect = async () => {

        //############################################################################################//
        //############################### Metamask Integration ###################################//
        //############################################################################################//    

        try {
            let provider, network, metamaskProvider, signer, accounts;

            if (typeof window.ethereum !== 'undefined') {
                // Connect to RPC  
                console.log('loadNetwork')
                try {

                    //console.log("acc", acc); 
                    //window.ethereum.enable();
                    //await handleAccountsChanged();
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await handleAccountsChanged(accounts);
                } catch (err) {
                    if (err.code === 4001) {
                        // EIP-1193 userRejectedRequest error
                        // If this happens, the user rejected the connection request.
                        console.log('Please connect to MetaMask.');
                    } else {
                        console.error(err);
                    }
                }
                provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/c811f30d8ce746e5a9f6eb173940e98a`)
                //const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
                setBlockchainProvider(provider);
                network = await provider.getNetwork()
                console.log(network.chainId);
                setNetworkId(network.chainId);

                // Connect to Metamask  
                metamaskProvider = new ethers.providers.Web3Provider(window.ethereum)
                setMetamask(metamaskProvider)

                signer = await metamaskProvider.getSigner(accounts[0])
                setMetamaskSigner(signer)

                metamaskNetwork = await metamaskProvider.getNetwork();
                setMetamaskNetwork(metamaskNetwork.chainId);

                console.log(network);

                if (network.chainId !== metamaskNetwork.chainId) {
                    alert("Your Metamask wallet is not connected to " + network.name);

                    setError("Metamask not connected to RPC network");
                }

                let tempContract = new ethers.Contract(contractAddress, Exchange, provider);
                setReadContract(tempContract); //contract
                let tempContract2 = new ethers.Contract(contractAddress, Exchange, signer);
                setWriteContract(tempContract2); //writeContract

                let USDCRead = new ethers.Contract(USDCContract, USDC_ABI, provider);
                setUSDC(USDCRead) //DAI
                let USDCWrite = new ethers.Contract(USDCContract, USDC_ABI, signer);
                setUSDC2(USDCWrite) //DAI2

                let INRCRead = new ethers.Contract(INRCContract, INRC_ABI, provider);
                setINRC(INRCRead) //DAI
                let INRCWrite = new ethers.Contract(INRCContract, INRC_ABI, signer);
                setINRC2(INRCWrite) //DAI2


            } else setError("Could not connect to any blockchain!!");

            return {
                provider, metamaskProvider, signer,
                network: network.chainId
            }

        } catch (e) {
            console.error(e);
            setError(e);
        }

    }
    const handleAccountsChanged = async (accounts) => {
        if (typeof accounts !== "string" || accounts.length < 1) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        console.log("t1", accounts);
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            alert('Please connect to MetaMask.');
        } else if (accounts[0] !== loggedInAccount) {
            setAccounts(accounts[0]);
        }
    }
    const init = async () => {

        const { provider, metamaskProvider, signer, network } = await connect();

        const accounts = await metamaskProvider.listAccounts();
        console.log(accounts[0]);
        setAccounts(accounts[0]);

        if (typeof accounts[0] == "string") {
            setEtherBalance(ethers.utils.formatEther(
                Number(await metamaskProvider.getBalance(accounts[0])).toString()
            ));
        }
    }
    useEffect(() => {


        init();

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        window.ethereum.on('chainChanged', function (networkId) {
            // Time to reload your interface with the new networkId
            //window.location.reload();
            unsetStates();
        })

    }, []);

    useEffect(() => {
        (async () => {
            init();
            // if (typeof metamask == 'object' && typeof metamask.getBalance == 'function'
            //     && typeof loggedInAccount == "string") {
            //     setEtherBalance(ethers.utils.formatEther(
            //         Number(await metamask.getBalance(loggedInAccount)).toString()
            //     ));

            // }
        })()
    }, [loggedInAccount]);

    const unsetStates = useCallback(() => {
        setBlockchainProvider(undefined);
        setMetamask(undefined);
        setMetamaskNetwork(undefined);
        setMetamaskSigner(undefined);
        setNetworkId(undefined);
        setAccounts(undefined);
        setEtherBalance(undefined);
    }, []);

    const isReady = useCallback(() => {

        return (
            typeof blockchainProvider !== 'undefined'
            && typeof metamask !== 'undefined'
            && typeof metamaskNetwork !== 'undefined'
            && typeof metamaskSigner !== 'undefined'
            && typeof networkId !== 'undefined'
            && typeof loggedInAccount !== 'undefined'
        );
    }, [
        blockchainProvider,
        metamask,
        metamaskNetwork,
        metamaskSigner,
        networkId,
        loggedInAccount,
    ]);

    //############################################################################################//
    //############################### Smart Contract Integration ###################################//
    //############################################################################################//


    const mintToken = async (amountIn) => {

        const signerAddress = await metamaskSigner.getAddress();

        const tokenBal = await USDC.balanceOf(signerAddress);
        //tokenBal = ethers.utils.formatEther(tokenBal);
        console.log(String(tokenBal))

        await USDC2.approve(contractAddress, tokenBal, { from: signerAddress, gasLimit: 50000 })

        amountIn = ethers.utils.parseEther(amountIn);
        await writeContract.mint(amountIn);

    }

    const redeemToken = async (amountOut) => {

        const signerAddress = await metamaskSigner.getAddress();

        const tokenBal = await USDC.balanceOf(contractAddress);
        //tokenBal = ethers.utils.formatEther(tokenBal);
        console.log(String(tokenBal))

        await USDC2.approve(contractAddress, tokenBal, { from: signerAddress, gasLimit: 50000 })

        const inrcBal = await INRC.balanceOf(signerAddress);
        //tokenBal = ethers.utils.formatEther(tokenBal);
        console.log(String(inrcBal))

        await INRC2.approve(contractAddress, inrcBal, { from: signerAddress, gasLimit: 50000 })


        amountOut = String(ethers.utils.parseEther(amountOut));
        await writeContract.redeem(amountOut, { gasLimit: 5000000 });

    }

    const INR_Balance = async (addr) => {
        // const signerAddress = await metamaskSigner.getAddress();
        let val = await contract.INR_BalanceOf(addr);

        val = String(ethers.utils.formatEther(val));
        console.log(String(val))
        setInrBal(val)

    }

    const USDC_Balance = async (addr) => {
        console.log("addr", addr)
        const signerAddress = await metamaskSigner.getAddress();
        let val = await contract.USDC_BalanceOf(addr);

        val = String(ethers.utils.formatEther(val));
        console.log(String(val))
        setUSDCBal(val)
    }

    const transferUSDCToOwner = async () => {
        await writeContract.transferFeesToOwner({ gasLimit: 500000 });
    }

    const mintUSDC = async (amt) => {
        amt = ethers.utils.parseEther(amt)
        await USDC2.mintUSDC(amt)
    }

    const getFees = async () => {
        let val = await contract.getFees();
        val = ethers.utils.formatEther(val);
        setDisplayFees(String(val));
    }

    if (isError) {
        return (
            <>

                <div className="alert alert-danger" role="alert">Error</div>;
            </>
        )
    } else if (!isReady()) {

        return (<p>Loading...</p>)

    } else {

        return (
            <div className="container">
                <nav className="navbar navbar-light bg-light">
                    <a className="navbar-brand" href="#">Navbar</a>
                </nav>
                <div class="row">

                    <div class="col-sm">

                        <div class="card" style={{ width: "18rem;" }}>
                            <div class="card-body">
                                <h5 class="card-title">Exchange</h5>
                                <p class="card-text">Provide USDC and get INR token in 1:80 ratio</p>
                                <form className="input" onSubmit={mintToken}>
                                    <input id='tokenIn' value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} type='text' placeholder="Token amount " />
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => mintToken(tokenInput)}> Mint </button>

                                </form>
                            </div>
                        </div>



                    </div>

                    <div class="col-sm">

                        <div class="card" style={{ width: "18rem;" }}>
                            <div class="card-body">
                                <h5 class="card-title">Mint USDC</h5>
                                <p class="card-text">Mint USDC (for testing)</p>
                                <form className="input" onSubmit={mintUSDC}>
                                    <input id='tokenIn' value={tokenInput3} onChange={(event) => setTokenInput3(event.target.value)} type='text' placeholder="Token amount " />
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => mintUSDC(tokenInput3)}> Mint </button>

                                </form>
                            </div>
                        </div>



                    </div>

                    <div class="col-sm">
                        <div class="card" style={{ width: "18rem;" }}>
                            <div class="card-body">
                                <h5 class="card-title">Redemption</h5>
                                <p class="card-text">Redemption fees: 0.5% </p>

                                <form className="input" onSubmit={redeemToken}>
                                    <input id='tokenIn' value={tokenInput2} onChange={(event) => setTokenInput2(event.target.value)} type='text' placeholder="Amount of Token to redeem" />
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => redeemToken(tokenInput2)}> Redeem </button>

                                </form>
                                <br />
                                <form className="input" onSubmit={transferUSDCToOwner}>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => transferUSDCToOwner()}> Transfer Fees to Owner </button>

                                </form>
                                <div className="font-weight-normal">
                                </div>

                            </div>
                        </div>
                    </div>

                    <div class="col-sm">
                        <div class="card" style={{ width: "18rem;" }}>
                            <div class="card-body" >
                                <input id='tokenIn' value={address} onChange={(event) => setAddress(event.target.value)} type='text' placeholder="Address" />
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => INR_Balance(address)}> INR Bal </button>
                                {inrBal}
                                <br /> <br />
                                <input id='tokenIn' value={address2} onChange={(event) => setAddress2(event.target.value)} type='text' placeholder="Address" />
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => USDC_Balance(address2)}> USDC Bal </button>
                                {USDCBal}
                                <br /> <br />
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => getFees()}> Fees </button>
                                <p>{displayFees}</p>
                                <div className="font-italic">
                                    <h6>Contract Address:</h6> {contractAddress}
                                </div>
                                <br />
                                <div className="font-italic">
                                    <h6>USDC address(Input Token):</h6> {USDCContract}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;

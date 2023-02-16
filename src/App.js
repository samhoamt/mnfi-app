import { useAccount, useConnect, useDisconnect, usePrepareContractWrite, useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { contractABI, contractAddress } from './config';
import { CssBaseline, Container, Typography, Grid, Card, CardMedia, CardContent, CardActions, Button, Alert, AlertTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [name, setName] = useState('Sunset');
  const [description, setDescription] = useState('Sunset view from my place');
  const [imageUrl, setImageUrl] = useState("https://gateway.pinata.cloud/ipfs/QmT1Mjo63eWrBpDn2AyVkN4u3Lz3roeaCRWqaDWKJr5Bo4");
  const [errMsg, setErrMsg] = useState('');
  const [errTitle, setErrTitle] = useState('');
  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'mint',
  });
  const { address, isConnected } = useAccount();
  const { connect, error: connect_Error } = useConnect({
    connector: new MetaMaskConnector(),
  });
  const { disconnect } = useDisconnect();

  // Mint
  const { write: mint, isSuccess: isMintStarted, isLoading: isMintLoading, data: mintData, error: MintError} = useContractWrite(config);

  const { isSuccess: txSuccess, error } = useWaitForTransaction({hash: mintData?.hash});

  // Get tokenURI
  const { data: tokenURI, error: tokenURI_Error } = useContractRead({ ...config, functionName: 'getTokenURI' });

  // Get maxMintLimit
  const { data: maxMintLimit, error: maxMintLimit_Error } = useContractRead({ ...config, functionName: 'maxMintLimit'});

  // Get minted count
  const { data: totalMinted, error: totalMinted_Error } = useContractRead({ ...config, functionName: 'totalMinted', watch: true });

  // Get balanceOf
  const { data: balanceOf, error: balanceOf_Error } = useContractRead({ ...config, functionName: 'balanceOf', args: [address], watch: true });

  useEffect(() => {
    if(isConnected){
      if(connect_Error){
        setErrTitle('Connect Error');
        setErrMsg(connect_Error.message);
      }else if(MintError) {
        setErrTitle('Mint Error');
        setErrMsg(MintError.message);
      }else if(tokenURI_Error) {
        setErrTitle('Token URI Error');
        setErrMsg(tokenURI_Error.message);
      }else if(maxMintLimit_Error) {
        setErrTitle('Max Mint Limit Error');
        setErrMsg(maxMintLimit_Error.message);
      }else if(totalMinted_Error) {
        setErrTitle('Total Minted Error');
        setErrMsg(totalMinted_Error.message);
      }else if(balanceOf_Error) {
        setErrTitle('Balance Of Error');
        setErrMsg(balanceOf_Error.message);
      }else if(error){
        setErrTitle('Transaction Error');
        setErrMsg(error.message);
      }else{
        setErrTitle('');
        setErrMsg('');
      }
    }else{
      setErrTitle('');
      setErrMsg('');
    }
    
  }, [MintError, tokenURI_Error, maxMintLimit_Error, totalMinted_Error, balanceOf_Error, connect_Error, error, isConnected]);

  // Fetch tokenURI
  useEffect(() => {
    try{
      if(tokenURI){
        axios.get(tokenURI).then(res => {
          const { name, description, image } = res.data;
          console.log({ name, description, image })
          setName(name);
          setDescription(description);
          setImageUrl(image);
        });
      }

    }catch(err){
      console.log('Fetch tokenURI error:', err);
    }
  }, [tokenURI]);

  const isMinted = txSuccess || (balanceOf?.toString() || 0) > 0;

  const reachMaxMintLimit = (totalMinted?.toString() || 0) === (maxMintLimit?.toString() || 0);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="sm">
        <Typography variant="h2">Mintable NFT</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {
              isConnected && <Button fullWidth variant='contained' onClick={disconnect}>Disconnect</Button>
            }
            {
              !isConnected && <Button fullWidth variant='contained' onClick={connect}>Connect</Button>
            }
          </Grid>
          {
            isConnected && (
              <Grid item xs={12}>
                <Card>
                  <CardMedia
                    sx={{ height: 0, paddingTop: '56.25%' }}
                    image={imageUrl}
                    title="Contemplative Reptile"
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {name}
                    </Typography>
                    <Typography sx={{mb: 1.5}} color="text.secondary">
                      Minted: {totalMinted?.toString() || 0}/{maxMintLimit?.toString() || 0}
                    </Typography>
                    <Typography variant="body2">
                      {description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button fullWidth variant='contained' color='secondary' disabled={isMinted || reachMaxMintLimit} onClick={mint}>
                      { isMinted && 'Minted' }
                      { isMintLoading && 'Waiting for approval'}
                      { !isMinted && isMintStarted && 'Minting...'}
                      { !isMinted && !isMintLoading && !isMintStarted && 'Mint'}
                      { reachMaxMintLimit && !isMinted && 'Max Mint Limit Reached'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          }
          {
            errMsg && <Grid item xs={12}>
              <Alert severity="error">
                <AlertTitle>{errTitle}</AlertTitle>
                {errMsg}
              </Alert>
            </Grid>
          }
        </Grid>
      </Container>
    </>
  )
}

export default App;

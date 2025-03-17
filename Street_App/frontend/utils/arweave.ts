import Arweave from 'arweave';
import fs from 'fs';
import path from 'path';

// Initialize Arweave
const arweave = new Arweave({
  host: process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'arweave.net',
  port: Number(process.env.NEXT_PUBLIC_ARWEAVE_PORT) || 443,
  protocol: process.env.NEXT_PUBLIC_ARWEAVE_PROTOCOL || 'https',
});

// Load and verify wallet key file
async function loadWallet() {
  try {
    let walletPath = process.env.ARWEAVE_WALLET_FILE_PATH;
    if (!walletPath) {
      throw new Error('ARWEAVE_WALLET_FILE_PATH not set in environment variables');
    }

    // Handle relative paths
    if (walletPath.startsWith('./')) {
      walletPath = path.join(process.cwd(), walletPath.slice(2));
    }

    // Check if file exists
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet file not found at path: ${walletPath}`);
    }
    
    console.log('Loading wallet from:', walletPath);
    const rawdata = fs.readFileSync(walletPath);
    let walletKey;
    try {
      walletKey = JSON.parse(rawdata.toString());
      console.log('Wallet format:', Object.keys(walletKey).join(', '));
    } catch (error) {
      const err = error as Error;
      throw new Error(`Invalid wallet file format: ${err.message}`);
    }

    // Verify wallet is valid by attempting to get its address
    try {
      const address = await arweave.wallets.getAddress(walletKey);
      console.log('Successfully loaded wallet with address:', address);
      
      // Verify wallet has funds
      const balance = await arweave.wallets.getBalance(address);
      const ar = arweave.ar.winstonToAr(balance);
      console.log('Wallet balance:', ar, 'AR');
      
      if (Number(ar) <= 0) {
        console.warn('Warning: Wallet has no funds. Transactions will fail.');
      }
      
      return walletKey;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Invalid wallet key file or insufficient funds: ${err.message}`);
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error loading Arweave wallet:', error);
    throw error;
  }
}

export async function inscribeToArweave({ data, tags = [] }: { 
  data: any, 
  tags?: { name: string, value: string }[] 
}) {
  try {
    // Load and verify wallet first
    const wallet = await loadWallet();
    
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    console.log('Preparing to inscribe data:', { type: data.type });

    // Create transaction with wallet
    console.log('Creating transaction...');
    
    // Get network info for the anchor
    const networkInfo = await arweave.network.getInfo();
    
    // Check wallet balance first
    const address = await arweave.wallets.getAddress(wallet);
    const balance = await arweave.wallets.getBalance(address);
    const balanceAr = arweave.ar.winstonToAr(balance);
    console.log('Wallet balance:', balanceAr, 'AR');
    
    const transaction = await arweave.createTransaction({
      data: jsonData,
      last_tx: networkInfo.current,
      reward: '1000000000'
    }, wallet);
    
    // Calculate and log transaction cost
    const fee = arweave.ar.winstonToAr(transaction.reward);
    console.log('Transaction cost:', fee, 'AR');
    
    if (Number(balanceAr) < Number(fee)) {
      throw new Error(`Insufficient funds. Balance: ${balanceAr} AR, Required: ${fee} AR`);
    }
    
    console.log('Transaction created with ID:', transaction.id);
    console.log('View transaction status at:', `https://viewblock.io/arweave/tx/${transaction.id}`);

    // Add default tags
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'Kinnected');
    transaction.addTag('Version', '1.0');
    transaction.addTag('Transaction-ID', transaction.id);
    
    // Add custom tags
    tags.forEach(tag => {
      transaction.addTag(tag.name, tag.value);
    });

    // Sign the transaction with wallet
    console.log('Signing transaction...');
    await arweave.transactions.sign(transaction, wallet);
    console.log('Transaction signed successfully');

    // Verify transaction before submitting
    const isValid = await arweave.transactions.verify(transaction);
    if (!isValid) {
      throw new Error('Transaction verification failed before submission');
    }
    console.log('Transaction verified successfully');

    // Submit the transaction
    console.log('Submitting transaction to Arweave...');
    const response = await arweave.transactions.post(transaction);
    console.log('Transaction submission response:', response);

    if (response.status === 200 || response.status === 202) {
      const walletAddress = await arweave.wallets.getAddress(wallet);
      console.log('Transaction submitted successfully from wallet:', walletAddress);
      console.log('Transaction Explorer URL:', `https://viewblock.io/arweave/tx/${transaction.id}`);
      
      return {
        success: true,
        transactionId: transaction.id,
        walletAddress: walletAddress,
        explorerUrl: `https://viewblock.io/arweave/tx/${transaction.id}`,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(`Failed to submit transaction to Arweave. Status: ${response.status}, Status Text: ${response.statusText}, Response Data: ${JSON.stringify(response.data)}`);
    }
  } catch (err) {
    const error = err as Error;
    console.error('Detailed Arweave inscription error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    throw error;
  }
}

export async function fetchArweaveData(query: string) {
  try {
    // Submit GraphQL query to Arweave
    const response = await arweave.api.post('graphql', {
      query: query
    });

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from Arweave GraphQL');
    }

    // Get the transactions
    const transactions = response.data.data.transactions.edges;

    // Fetch actual data for each transaction
    const results = await Promise.all(
      transactions.map(async (edge: any) => {
        try {
          const tx = await arweave.transactions.get(edge.node.id);
          const data = tx.data;
          const decoded = Buffer.from(data).toString();
          return {
            transactionId: edge.node.id,
            data: JSON.parse(decoded),
            tags: edge.node.tags,
            timestamp: new Date().toISOString() // You might want to get this from transaction metadata
          };
        } catch (error) {
          console.error(`Error fetching transaction ${edge.node.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed fetches
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error fetching Arweave data:', error);
    throw error;
  }
} 
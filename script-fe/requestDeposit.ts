import { use } from "chai";
import * as anchor from "@coral-xyz/anchor";
// import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, PublicKey, Keypair, VersionedTransaction } from "@solana/web3.js";
import idl from "../target/idl/lucky_trading.json"; // File IDL của chương trình

import { Program } from "@project-serum/anchor";
import { LuckyTrading } from "../target/types/lucky_trading";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const VAULT_SEED = "vault";
import * as dotenv from "dotenv";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
dotenv.config();

async function main() {
    const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
    const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
    const wallet = new anchor.Wallet(keypair);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    const program = new Program(idl as LuckyTrading, "ATnAJWbLWJHc3qCb7ai4cSiWgaUFXqMhmZs7qQfSHxsX", provider);
    const agent = new PublicKey("4xDfHSD5ac6sSSgNEUjU35tGnWuQCuzc9iUNNE4aNe1u");
    const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED), agent.toBuffer()],
        program.programId
    )[0];
    let [vaultUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
    );

    let [vaultAgentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultPda.toBuffer(), agent.toBuffer()],
        program.programId
    );
    console.log("user", wallet.publicKey.toBase58());
    console.log("vault", vaultPda.toBase58());
    console.log("vaultUserPda", vaultUserPda.toBase58());
    console.log("vaultAgentPda", vaultAgentPda.toBase58());
    const collateral = new PublicKey("Bv773jeAs3nsU9NnUM8pYWAXsggqp2NCtpuMzSS3E1fg");
    const amount = new anchor.BN(0);

    let userCollateralATA = await getAssociatedTokenAddress(collateral, wallet.publicKey);
    let vaultCollateralATA = await getAssociatedTokenAddress(collateral, vaultPda, true);
    console.log("vaultCollateralATA", vaultCollateralATA.toBase58());
    try {
        let txBase64 =
            "Ahj13uTXsoK1ITSG4Xyl8entf/xQmILapp8l9UuauyllpSCAXV4gxx8NmJiNr1ncHMWhgLp439ox6GLLgZ+7vA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAGDTq4Ue7gvnO0WYFz+7ZvAj9BNzKxwZ2jATTFsZJcnDBgr2iCVGKNT/VIWsqMxxyJOuZ0NatqL9yGMgarSL6nQ/wMbZGGtY+XSISRNK5IppKhQhlW7KRck06QvN3WGtivkUS4+mI7I/B2qBJIFdTO/V2WJgXCU18amHxHrMuYKjWoY26ZrchFOLBN/Ar3Dm6yHjCTZgZEsIrg/nEhoaYrNMCiL43jpMLXCLcHqe/DSLDuYmzoTVEHOyWYV+dW0nsGS+blnll2lPY0xFe1J9XCDQ7HtJUGBPKe0uf+GGkveV59AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpBt324e51j94YQl285GzN2rYa/E2DuQ0n/r35KNihi/yMlVisBbnv/QrRh8PKt2VypxYTdnx/pByVbfJmXtu+voyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZuut+fvw6KOyNAcxVLLVycN8glPkkRaZPFMf2ur7neeoDCAAFAiChBwAIAAkDQA0DAAAAAAALCwEAAgMFBAYJCgwHIPIjxolS4fK2AAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAA";

        const parsedTx = anchor.web3.Transaction.from(Buffer.from(txBase64, "base64"));
        const transaction = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
        //
        const numRequiredSignatures = transaction.message.header.numRequiredSignatures;
        const signers = transaction.message.staticAccountKeys.slice(0, numRequiredSignatures);
        console.log(
            "Signers cần thiết:",
            signers.map((key) => key.toBase58())
        );
        console.log("Ví của bạn:", wallet.payer.publicKey.toBase58());
        console.log(parsedTx);
        //
        parsedTx.partialSign(wallet.payer);
        const txHash = await provider.connection.sendRawTransaction(parsedTx.serialize());
        const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
        await provider.connection.confirmTransaction({
            signature: txHash,
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight,
        });
    } catch (err) {
        console.error("Không thể lấy dữ liệu vault:", err);
    }
}
main().catch((err) => {
    console.error("Lỗi:", err);
});

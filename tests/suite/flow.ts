import * as anchor from "@coral-xyz/anchor";
import {
    Account,
    createAssociatedTokenAccount,
    createMint,
    getAccount,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";

import { Connection, PublicKey } from "@solana/web3.js";
import { assert, expect, use } from "chai";
import { getBalanceLPLockUser, getBalanceLPUser, getTotalLP } from "../case/utils";
import { LuckyTrading } from "../../target/types/lucky_trading";
export const flow = async function ({
    owner,
    agent,
    user,
}: {
    owner: anchor.Wallet;
    agent: anchor.Wallet;
    user: anchor.Wallet;
}) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;
    let userCollateralATA: PublicKey;
    let vaultCollateralATA: PublicKey;
    let agentCollateralATA: PublicKey;
    let vault: PublicKey;
    let vaultUserPda: PublicKey;
    let collateralDecimals = 6;

    return describe("Deposit tests", function () {
        before("Initialize collateral", async function () {
            collateral = await createMint(
                provider.connection,
                {
                    publicKey: owner.payer.publicKey,
                    secretKey: owner.payer.secretKey,
                },
                owner.payer.publicKey,
                owner.payer.publicKey,
                6
            );

            //userCollateralATA = await getAssociatedTokenAddress(collateral, user.publicKey);
            userCollateralATA = (
                await getOrCreateAssociatedTokenAccount(provider.connection, user.payer, collateral, user.publicKey)
            ).address;

            agentCollateralATA = await getAssociatedTokenAddress(collateral, agent.publicKey);
            console.log(" Before mint");
            await mintTo(
                provider.connection,
                owner.payer,
                collateral,
                userCollateralATA,
                owner.payer.publicKey,
                1e6 * 10 ** collateralDecimals
            );

            //console.log("After mint");

            [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), agent.publicKey.toBuffer()],
                program.programId
            );

            [vaultUserPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), vault.toBuffer(), user.publicKey.toBuffer()],
                program.programId
            );

            vaultCollateralATA = await getAssociatedTokenAddress(collateral, vault, true);

            await program.methods
                .openVault(agent.publicKey)
                .accounts({
                    authority: owner.publicKey,
                    collateral: collateral,
                    vaultCollateral: vaultCollateralATA,
                    vault: vault,
                })
                .signers([owner.payer])
                .rpc();
            const vaultOnChain = await program.account.vault.fetch(vault);
            expect(vaultOnChain.authority).to.eql(owner.publicKey);
        });

        it("user can lock LP", async function () {
            let amountLpLock = 0;
            await program.methods
                .requestWithdraw(agent.publicKey, new anchor.BN(amountLpLock))
                .accounts({
                    user: user.publicKey,
                    vault: vault,
                    collateral: collateral,
                    vaultUser: vaultUserPda,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer])
                .rpc();
            console;
            let balanceLPLock = await getBalanceLPLockUser(user.publicKey, vault);
            expect(balanceLPLock).to.eq(BigInt(amountLpLock));
        });
        return;
        it("user can deposit to vault", async function () {
            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;

            let tx = await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                .accounts({
                    agent: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .instruction();

            await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                .accounts({
                    agent: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer, agent.payer])
                .rpc();
            console;
            let balanceLP = await getBalanceLPUser(user.publicKey, vault);
            expect(balanceLP).to.eq(BigInt(amountLp));

            let totalLP = await getTotalLP(vault);
            expect(totalLP).to.eq(BigInt(amountLp));
        });

        it("user can lock LP", async function () {
            let amountLpLock = 1e4 * 10 ** collateralDecimals;
            // let tx = await program.methods
            //     .requestWithdraw(agent.publicKey, new anchor.BN(amountLpLock))
            //     .accounts({
            //         user: user.publicKey,
            //         vault: vault,
            //         collateral: collateral,
            //         vaultUser: vaultUserPda,
            //         userCollateral: userCollateralATA,
            //         vaultCollateral: vaultCollateralATA.address,
            //         token2022Program: TOKEN_2022_PROGRAM_ID,
            //     })
            //     .instruction();

            // console.log(tx);
            await program.methods
                .requestWithdraw(agent.publicKey, new anchor.BN(amountLpLock))
                .accounts({
                    user: user.publicKey,
                    vault: vault,
                    collateral: collateral,
                    vaultUser: vaultUserPda,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer])
                .rpc();
            console;
            let balanceLPLock = await getBalanceLPLockUser(user.publicKey, vault);
            expect(balanceLPLock).to.eq(BigInt(amountLpLock));
        });

        it("agent send reward for user ", async function () {
            let reward = 1e4 * 10 ** collateralDecimals;
            let amountLpLock = 1e4 * 10 ** collateralDecimals;
            await program.methods
                .withdrawForUser(user.publicKey, new anchor.BN(amountLpLock), new anchor.BN(reward))
                .accounts({
                    agent: agent.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([agent.payer])
                .rpc();
            console;
            let balanceLPLock = await getBalanceLPLockUser(user.publicKey, vault);
            expect(balanceLPLock).to.eq(BigInt(0));
        });

        it("can flow signer -> user to vault with LP", async function () {
            const amount = 1e5 * 10 ** collateralDecimals;
            const amountLp = 1e5 * 10 ** collateralDecimals;
            const nonce = 1;
            const tx = new anchor.web3.Transaction();
            let totalLPBefore = await getTotalLP(vault);
            const depositIx = await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(nonce))
                .accounts({
                    agent: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .instruction();
            tx.add(depositIx);
            const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = user.publicKey;
            tx.partialSign(agent.payer);
            let serializedTx = tx.serialize({ requireAllSignatures: false });
            const txBase64 = serializedTx.toString("base64");
            console.log(txBase64);
            const txHex = serializedTx.toString("hex");
            const parsedTx = anchor.web3.Transaction.from(Buffer.from(txHex, "hex"));
            parsedTx.partialSign(user.payer);
            const txHash = await provider.connection.sendRawTransaction(parsedTx.serialize());
            await provider.connection.confirmTransaction({
                signature: txHash,
                blockhash: blockhash,
                lastValidBlockHeight: lastValidBlockHeight,
            });

            let balanceLP = await getBalanceLPUser(user.publicKey, vault);
            //expect(balanceLP).to.eq(BigInt(1e6 - amountLp));
            let totalLPAfter = await getTotalLP(vault);
            //expect(totalLPAfter - totalLPBefore).to.eq(BigInt(amountLp));
        });

        it(" can get total value of vault", async function () {
            let data = await program.account.vault.fetch(vault);
            // console.log(" total collateral value", data.collateralAmount.toString());
            // console.log(" total LP value", data.totalLp.toString());
        });

        it("user can send withdraw reward", async function () {
            let amountLpLock = 0;
            await program.methods
                .requestWithdraw(agent.publicKey, new anchor.BN(amountLpLock))
                .accounts({
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer])
                .rpc();
        });

        it("agent can withdraw from vault", async function () {
            let amount = new anchor.BN(1e5 * 10 ** collateralDecimals);
            let balanceBefore = await getAccount(provider.connection, agentCollateralATA);
            await program.methods
                .withdrawByAi(amount)
                .accounts({
                    agent: agent.publicKey,
                    vault: vault,
                    collateral: collateral,
                    agentCollateral: agentCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([agent.payer])
                .rpc();
            let balanceAfter = await getAccount(provider.connection, agentCollateralATA);
            expect(balanceAfter.amount - balanceBefore.amount).to.eq(BigInt(1e5 * 10 ** collateralDecimals));
        });

        it("agent can deposit to vault", async function () {
            let amount = new anchor.BN(1e5 * 10 ** collateralDecimals);
            let balanceBefore = await getAccount(provider.connection, agentCollateralATA);
            await program.methods
                .depositByAi(amount)
                .accounts({
                    agent: agent.publicKey,
                    vault: vault,
                    collateral: collateral,
                    aiCollateral: agentCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([agent.payer])
                .rpc();
            let balanceAfter = await getAccount(provider.connection, agentCollateralATA);
            expect(balanceBefore.amount - balanceAfter.amount).to.eq(BigInt(1e5 * 10 ** collateralDecimals));
        });
    });
};

import {
    Account,
    createAssociatedTokenAccount,
    createMint,
    getAccount,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorError, Program, Wallet } from "@coral-xyz/anchor";

import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert, expect, use } from "chai";
import { getBalanceLPLockUser, getBalanceLPUser, getTotalLP } from "../case/utils";
import { LuckyTrading } from "../../target/types/lucky_trading";
import * as anchor from "@coral-xyz/anchor";
export const depositTest = async function ({ owner, agent, user }: { owner: Wallet; agent: Wallet; user: Wallet }) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;
    let anotherCollateral: PublicKey;
    let userCollateralATA: PublicKey;
    let vaultCollateralATA: Account;
    let agentCollateralATA: Account;
    let vault: PublicKey;
    let vaultUserPda: PublicKey;
    let collateralDecimals = 6;
    let anotherUser = new anchor.Wallet(anchor.web3.Keypair.generate());
    let anotherUserCollateralATA: PublicKey;
    let anotherVault: PublicKey;
    let anotherVaultUserPda: PublicKey;
    return describe("Deposit tests", function () {
        before("Initialize collateral", async function () {
            const airdropSig = await provider.connection.requestAirdrop(anotherUser.publicKey, 100 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropSig);

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

            userCollateralATA = await createAssociatedTokenAccount(
                provider.connection,
                user.payer,
                collateral,
                user.publicKey
            );

            anotherUserCollateralATA = await createAssociatedTokenAccount(
                provider.connection,
                anotherUser.payer,
                collateral,
                anotherUser.publicKey
            );

            agentCollateralATA = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                agent.payer,
                collateral,
                agent.publicKey,
                true
            );

            await mintTo(
                provider.connection,
                owner.payer,
                collateral,
                userCollateralATA,
                owner.payer.publicKey,
                1e6 * 10 ** collateralDecimals
            );

            [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), agent.publicKey.toBuffer()],
                program.programId
            );

            [vaultUserPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), vault.toBuffer(), user.publicKey.toBuffer()],
                program.programId
            );

            vaultCollateralATA = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                owner.payer,
                collateral,
                vault,
                true
            );

            await program.methods
                .openVault(agent.publicKey)
                .accounts({
                    authority: owner.publicKey,
                    collateral: collateral,
                    vault: vault,
                })
                .signers([owner.payer])
                .rpc();
            const vaultOnChain = await program.account.vault.fetch(vault);
            expect(vaultOnChain.authority).to.eql(owner.publicKey);
        });

        it("failds when use another user's collateral ATA", async function () {
            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;

            try {
                await program.methods
                    .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                    .accounts({
                        agent: agent.publicKey,
                        user: user.publicKey,
                        vault: vault,
                        vaultUser: vaultUserPda,
                        collateral: collateral,
                        userCollateral: anotherUserCollateralATA,
                        vaultCollateral: vaultCollateralATA.address,
                        token2022Program: TOKEN_2022_PROGRAM_ID,
                    })
                    .signers([user.payer, agent.payer])
                    .rpc();
                assert(false, "should've failed but didn't ");
            } catch (e) {
                expect(e).to.be.instanceOf(AnchorError);
                expect(e.toString()).to.contain("Wrong owner in user collateral ATA");
            }
        });

        it("failds when use another collateral ATA", async function () {
            let anotherCollateral = await createMint(
                provider.connection,
                {
                    publicKey: owner.payer.publicKey,
                    secretKey: owner.payer.secretKey,
                },
                owner.payer.publicKey,
                owner.payer.publicKey,
                6
            );

            let anotherUserCollateralATA = await createAssociatedTokenAccount(
                provider.connection,
                anotherUser.payer,
                anotherCollateral,
                anotherUser.publicKey
            );

            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;

            try {
                await program.methods
                    .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                    .accounts({
                        agent: agent.publicKey,
                        user: user.publicKey,
                        vault: vault,
                        vaultUser: vaultUserPda,
                        collateral: anotherCollateral,
                        userCollateral: anotherUserCollateralATA,
                        vaultCollateral: vaultCollateralATA.address,
                        token2022Program: TOKEN_2022_PROGRAM_ID,
                    })
                    .signers([user.payer, agent.payer])
                    .rpc();
                assert(false, "should've failed but didn't ");
            } catch (e) {
                expect(e).to.be.instanceOf(AnchorError);
                expect(e.toString()).to.contain("Wrong collateral");
            }
        });

        it("failds when use another signer compare agent", async function () {
            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;
            try {
                await program.methods
                    .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                    .accounts({
                        agent: agent.publicKey,
                        user: user.publicKey,
                        vault: vault,
                        vaultUser: vaultUserPda,
                        collateral: collateral,
                        userCollateral: userCollateralATA,
                        vaultCollateral: vaultCollateralATA.address,
                        token2022Program: TOKEN_2022_PROGRAM_ID,
                    })
                    .signers([user.payer, anotherUser.payer])
                    .rpc();
                assert(false, "should've failed but didn't ");
            } catch (e) {
                expect(e.toString()).to.contain("unknown signer");
            }
        });

        xit("succeed user can deposit to vault", async function () {
            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;
            await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                .accounts({
                    agent: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA.address,
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
    });
};

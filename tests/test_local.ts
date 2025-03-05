import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer } from "@solana/web3.js";
import { openVaultTest } from "./suite/openVaultTest";
import { depositTest } from "./suite/depositTest";
import { flow } from "./suite/flow";
import { requestWithdrawTest } from "./suite/requestWithdrawTest";

anchor.setProvider(anchor.AnchorProvider.env());
const provider = anchor.AnchorProvider.env();
let controllerPda: PublicKey;
let redeemableMintPda: PublicKey;
const CONTROLLER_SEED = "CONTROLLER";
const REDEEMABLE_MINT_SEED = "REDEEMABLE";
(async () => {
    let owner = new Wallet(anchor.web3.Keypair.generate());

    let user = new Wallet(anchor.web3.Keypair.generate());

    let agent = new Wallet(anchor.web3.Keypair.generate());

    let userRedeemATA: PublicKey;

    describe("Integration tests", async function () {
        before("Initialize Lending program", async function () {
            const airdropSig = await provider.connection.requestAirdrop(user.publicKey, 100 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropSig);
            const airdropSig2 = await provider.connection.requestAirdrop(owner.publicKey, 100 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropSig2);
            await provider.connection.confirmTransaction(
                await provider.connection.requestAirdrop(agent.publicKey, 100 * LAMPORTS_PER_SOL)
            );
        });

        it("flow test", async function () {
            await flow({ owner, agent, user });
        });

        it("open vault test", async function () {
            await openVaultTest({ owner, agent });
        });

        it("deposit test", async function () {
            await depositTest({ owner, agent, user });
        });

        it("request withdraw test", async function () {
            await requestWithdrawTest({ owner, user });
        });

        this.afterAll("Transfer funds back to bank", async function () {});
    });
})();

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{constants::constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
pub struct OpenVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub ai_key: Signer<'info>,

    #[account(
        init,
        seeds = [VAULT_SEED, ai_key.key.as_ref() ], 
        bump,
        payer = authority,
        space = Vault::VAULT_SPACE
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub collateral: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<OpenVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
        vault.bump = ctx.bumps.vault;
        vault.ai_key = ctx.accounts.ai_key.key();
        vault.nonce = 0;
        vault.collateral = ctx.accounts.collateral.key();
        vault.collateral_amount = 0;
        vault.total_lp_supply = 0;
        vault.is_paused = false;
    Ok(())
}

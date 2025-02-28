use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{constants::constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
#[instruction(
    agent: Pubkey,
)]
pub struct OpenVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    // #[account(mut)]
    // pub ai: Signer<'info>,
    #[account(
        init,
        seeds = [VAULT_SEED, agent.as_ref() ], 
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

pub(crate) fn handler(ctx: Context<OpenVault>, agent: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
        vault.bump = ctx.bumps.vault;
        vault.authority = *ctx.accounts.authority.key;
        vault.agent = agent; 
        vault.nonce = 0;
        vault.collateral = ctx.accounts.collateral.key();
        vault.collateral_amount = 0;
        vault.total_lp = 0;
        vault.is_paused = false;
    Ok(())
}

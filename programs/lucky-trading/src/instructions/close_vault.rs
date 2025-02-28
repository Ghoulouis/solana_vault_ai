use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{constants::constants::VAULT_SEED, state::Vault};

#[derive(Accounts)]
#[instruction(
    agent: Pubkey,
)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
  
    #[account(
        mut,
        seeds = [VAULT_SEED, agent.as_ref() ], 
        bump,
        close = authority,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub collateral: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<CloseVault>, agent: Pubkey) -> Result<()> {
    // let vault = &mut ctx.accounts.vault;
    //     vault.bump = ctx.bumps.vault;
    //     vault.authority = *ctx.accounts.authority.key;
    //     vault.ai_key = ctx.accounts.ai_key.key();
    //     vault.nonce = 0;
    //     vault.collateral = ctx.accounts.collateral.key();
    //     vault.collateral_amount = 0;
    //     vault.total_lp = 0;
    //     vault.is_paused = false;
    Ok(())
}

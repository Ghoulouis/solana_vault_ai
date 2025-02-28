use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::{vault, Vault, VaultUser}};

#[derive(Accounts)]
pub struct DepositByAI<'info> {

    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.key.as_ref() ], 
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidError,
    )]
    pub collateral: Box<Account<'info, Mint>>,
   
    #[account(
        mut,
        constraint = ai_collateral.mint == collateral.key() @VaultError::InvalidError,
        constraint = ai_collateral.owner == agent.key() @VaultError::InvalidError,
    )]
    pub ai_collateral: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        constraint = vault_collateral.mint == collateral.key() @VaultError::InvalidError,
        constraint = vault_collateral.owner == vault.key() @VaultError::InvalidError,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,


    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<DepositByAI>,  collateral_amount: u64) -> Result<()> {
   let collateral = &ctx.accounts.collateral;
   let ai = &ctx.accounts.agent;
    // transfer
    transfer_helper(ctx.accounts.ai_collateral.to_account_info(),
     ctx.accounts.vault_collateral.to_account_info(),
     collateral,
     ai.to_account_info(),
     ctx.accounts.token_program.to_account_info(),
     ctx.accounts.token_2022_program.to_account_info(),
     collateral_amount,
     None
    )?;
    
    let vault = &mut ctx.accounts.vault;
    vault.collateral_amount = collateral_amount.checked_add(vault.collateral_amount).ok_or(VaultError::InvalidCollateralAmount)?;


    
    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::{ Vault, VaultUser}};

#[derive(Accounts)]
#[instruction(
    user: Pubkey,
)]
pub struct WithdrawForUser<'info> {
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
        seeds = [VAULT_SEED, vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub vault_user: Box<Account<'info, VaultUser>>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidError,
    )]
    pub collateral: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_collateral.mint == collateral.key() @VaultError::InvalidError,
        constraint = user_collateral.owner == user.key() @VaultError::InvalidError,
    )]
    pub user_collateral: Box<Account<'info, TokenAccount>>,
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

impl <'info> WithdrawForUser<'info> {
    pub fn handler(&mut self, _user: Pubkey, lp_amount: u64, collateral_amount: u64) -> Result<()> {
    let vault_user = &mut self.vault_user;
    let vault = &mut self.vault;
    let collateral = &mut self.collateral;


    require!(vault_user.lp_lock == lp_amount, VaultError::InvalidLPLock);
    // update vault_user
    vault_user.lp_lock  = vault_user.lp_lock.checked_sub(lp_amount).ok_or(VaultError::Overflow)?;
    // updatre vault 
    vault.total_lp = vault.total_lp.checked_sub(lp_amount).ok_or(VaultError::Overflow)?;
    vault.total_lp_lock = vault.total_lp_lock.checked_sub(lp_amount).ok_or(VaultError::Overflow)?;
    vault.collateral_amount = vault.collateral_amount.checked_sub(collateral_amount).ok_or(VaultError::Overflow)?;

    // transfer collateral to user
    transfer_helper(self.vault_collateral.to_account_info(),
    self.user_collateral.to_account_info(),
    collateral,
    vault.to_account_info(),
    self.token_program.to_account_info(),
    self.token_2022_program.to_account_info(),
    collateral_amount,
     Some(&[&[VAULT_SEED, self.agent.key().as_ref(), &[vault.bump] ]]),
    )?;

    Ok(())
}

}

use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};
use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::Vault, AgentWithdrawEvent};

#[derive(Accounts)]
pub struct WithdrawByAI<'info> {

    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.key.as_ref()], 
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidCollateralAccount,
    )]
    pub collateral: Box<Account<'info, Mint>>,
   
    #[account(
        mut,
        constraint = agent_collateral.mint == collateral.key() @VaultError::InvalidAICollateralATAAccount,
        constraint = agent_collateral.owner == agent.key() @VaultError::InvalidAICollateralATAAccount,
    )]
    pub agent_collateral: Box<Account<'info, TokenAccount>>,
     
    #[account(
        mut,
        constraint = vault_collateral.mint == collateral.key() @VaultError::InvalidVaultCollateralATAAccount,
        constraint = vault_collateral.owner == vault.key() @VaultError::InvalidVaultCollateralATAAccount,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl  <'info> WithdrawByAI<'info> {
    pub(crate) fn handler(&mut self,  collateral_amount: u64) -> Result<()> {
   let collateral = &mut self.collateral;
    let vault = &mut self.vault;
    transfer_helper(self.vault_collateral.to_account_info(),
     self.agent_collateral.to_account_info(),
     collateral,
     vault.to_account_info(),
     self.token_program.to_account_info(),
     self.token_2022_program.to_account_info(),
     collateral_amount,
     Some(&[&[VAULT_SEED, self.agent.key().as_ref(), &[vault.bump] ]]),
    )?;
    let vault = &mut self.vault;
    vault.collateral_amount = vault.collateral_amount.checked_sub(collateral_amount).ok_or(VaultError::InvalidCollateralAmount)?;

    
    emit!(AgentWithdrawEvent {
        collateral_amount,
    });

    Ok(())
}

}

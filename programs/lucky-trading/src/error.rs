use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("ERROR")]
    InvalidError,

    #[msg("Wrong collateral account")]
    InvalidCollateralAccount,

    #[msg("Wrong AI collateral ATA account")]
    InvalidAICollateralATAAccount,

    #[msg("Wrong vault collateral ATA account")]
    InvalidVaultCollateralATAAccount,

    #[msg("Wrong owner when transfer")]
    InvalidOwnerTransfer,
}

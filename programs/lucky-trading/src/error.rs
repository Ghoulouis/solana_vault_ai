use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("ERROR")]
    InvalidError,

    #[msg("Wrong authority")]
    InvalidAuthority,

    #[msg("Wrong collateral account")]
    InvalidCollateralAccount,

    #[msg("Wrong AI collateral ATA account")]
    InvalidAICollateralATAAccount,

    #[msg("Wrong vault collateral ATA account")]
    InvalidVaultCollateralATAAccount,

    #[msg("Wrong owner when transfer")]
    InvalidOwnerTransfer,

    #[msg("Wrong collateral amount")]
    InvalidCollateralAmount,

    #[msg("Vault is not empty")]
    VaultNotEmpty,

    #[msg("Wrong owner in user collateral ATA")]
    InvalidOwnerUserCollateralATA,

    #[msg("Wrong collateral in user collateral ATA")]
    InvalidCollateralUserCollateralATA,

    #[msg("Wrong collateral")]
    InvalidCollateral,

    #[msg("Overflow")]
    Overflow,
}

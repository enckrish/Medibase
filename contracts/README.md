# Smart Contract Deploy Arguments
1. `admin`: public key of the account that has extra privileges like adding adding validators, invalidating ids, removing validators etc.
2. `fee`: fee collected in exchange of a PayID.
3. `adminFee`: fee collected by admin to facilitate its duties. adminFee must be less than 1000 which will denote 100%. Similarly, 123 will denote 12.3% of total fee accumulated will be given to the admin in addition to the validator rewards.

The mnemonic of the private key from which the `admin` address is derived, will be required when running the `medibase-admin-cli`.

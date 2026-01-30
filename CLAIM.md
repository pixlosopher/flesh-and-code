# Flesh & Code: Arrow Claim System

## Overview

A free-to-claim system for the 320 philosophical arrows from "Flesh and Code: Arrows and Axioms". Inspired by CryptoPunks' early 2017 distribution model, users can claim individual arrows as unique digital artifacts.

> "Touch a screen and the screen fingerprints you back."

---

## Concept

Each of the 320 arrows becomes a claimable on-chain artifact:
- **Free to claim** (users only pay gas)
- **One arrow per wallet** (initially, to ensure fair distribution)
- **Allowlist-gated** to prevent bot farming
- **Permanent ownership** on-chain

### The Arrows

The book contains 320 arrows across 7 thematic axes:

| Theme | Arrows | Example |
|-------|--------|---------|
| I. Encroachment | ~46 | "Edges are the myths of solids." |
| II. Passivity | ~46 | "Stillness is not absence but a held breath." |
| III. Chiasmic Entanglement | ~46 | "The gaze is never one-way." |
| IV. Reversible Time | ~46 | "Pixels kiss—compression is their bruise." |
| V. Visibility/Invisibility | ~46 | "What hides in plain sight rules in secret." |
| VI. Worlding | ~46 | "Every interface is a dialect." |
| VII. Creation & Destiny | ~44 | "Glitch is not error; it is confession." |

---

## Distribution Model

### Phase 1: Allowlist Collection
- Collect wallet addresses from:
  - Early followers on X (@pixlosopher) and Instagram
  - Existing collectors/supporters
  - Email signup on website
  - Community members who engage meaningfully

### Phase 2: Claim Window
- Allowlisted wallets can claim **1 arrow** during initial window
- Random assignment OR user selection (TBD)
- Duration: 48-72 hours

### Phase 3: Public Claim
- Remaining unclaimed arrows open to public
- Still free (gas only)
- May allow multiple claims per wallet

### Phase 4: Secondary Market
- Arrows tradeable on OpenSea/Blur
- Royalties: 5-7.5% to creator

---

## Technical Architecture

### Smart Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FleshAndCodeArrows is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 320;
    uint256 public totalClaimed;

    bytes32 public merkleRoot;
    bool public allowlistActive = true;

    mapping(address => bool) public hasClaimed;
    mapping(uint256 => bool) public arrowClaimed;

    string private _baseTokenURI;

    constructor(bytes32 _merkleRoot) ERC721("Flesh & Code Arrows", "ARROW") {
        merkleRoot = _merkleRoot;
    }

    function claimArrow(uint256 arrowId, bytes32[] calldata proof) external {
        require(arrowId > 0 && arrowId <= MAX_SUPPLY, "Invalid arrow");
        require(!arrowClaimed[arrowId], "Arrow already claimed");
        require(!hasClaimed[msg.sender], "Already claimed");

        if (allowlistActive) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(proof, merkleRoot, leaf), "Not allowlisted");
        }

        hasClaimed[msg.sender] = true;
        arrowClaimed[arrowId] = true;
        totalClaimed++;

        _safeMint(msg.sender, arrowId);
    }

    function setAllowlistActive(bool _active) external onlyOwner {
        allowlistActive = _active;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
```

### Metadata Structure (JSON)

```json
{
  "name": "Arrow #142",
  "description": "From Flesh & Code: Arrows and Axioms",
  "image": "ipfs://[CID]/142.gif",
  "attributes": [
    {
      "trait_type": "Theme",
      "value": "IV. Reversible Time"
    },
    {
      "trait_type": "Front",
      "value": "Pixels kiss—compression is their bruise."
    },
    {
      "trait_type": "Back",
      "value": "Artifacts emerge where data is squeezed, leaving visible scars of algorithmic intimacy."
    },
    {
      "trait_type": "Arrow Number",
      "display_type": "number",
      "value": 142
    }
  ],
  "external_url": "https://fleshandcode.art/arrow/142"
}
```

---

## Chain Selection

| Chain | Pros | Cons |
|-------|------|------|
| **Ethereum Mainnet** | Prestige, liquidity, permanence | High gas costs |
| **Base** | Low gas, Coinbase ecosystem, growing | Less established |
| **Zora** | Art-focused, creator-friendly | Smaller ecosystem |
| **Optimism** | Low gas, good tooling | Less NFT activity |

**Recommendation**: **Base** or **Zora** for accessibility (low gas = truly free claims)

---

## Visual Assets

Each arrow needs:
1. **Primary visual**: Associated GIF from the 101 collection (or generated art)
2. **Text rendering**: The arrow text as typography art
3. **Animation**: Glitch/CRT aesthetic consistent with project

### Asset Generation Options
- Use existing 101 GIFs, map to arrows thematically
- Generate unique visuals per arrow using AI + glitch processing
- Create a unified template with arrow text + generative elements

---

## Website Integration

### Claim Interface

Add a new section to the website:

```
/claim
├── Connect wallet button
├── Allowlist status check
├── Arrow selection grid (320 items)
│   ├── Claimed (greyed out, shows owner)
│   ├── Available (clickable)
│   └── Yours (highlighted)
├── Claim button
└── Transaction status
```

### Features
- Real-time claim status updates
- Search/filter arrows by theme
- Preview arrow before claiming
- Share claimed arrow on social

---

## Anti-Bot Measures

1. **Merkle tree allowlist** - Only approved wallets can claim
2. **One claim per wallet** - Enforced on-chain
3. **Human verification** - Optional CAPTCHA on frontend
4. **Gradual allowlist release** - Add addresses in batches
5. **Time-delayed reveals** - Don't show all metadata immediately

---

## Roadmap

### Phase 0: Preparation (Current)
- [x] Website live with book content
- [x] GIF gallery (101 pieces)
- [ ] Finalize all 320 arrow texts
- [ ] Generate/assign visuals for each arrow
- [ ] Build allowlist (target: 500-1000 addresses)

### Phase 1: Development
- [ ] Deploy smart contract to testnet
- [ ] Create metadata for all 320 arrows
- [ ] Upload assets to IPFS/Arweave
- [ ] Build claim interface
- [ ] Security audit (optional but recommended)

### Phase 2: Launch
- [ ] Deploy to mainnet (Base/Zora)
- [ ] Announce claim window
- [ ] Open allowlist claims
- [ ] Monitor and support

### Phase 3: Post-Launch
- [ ] Open public claims for remaining arrows
- [ ] List on OpenSea/Blur
- [ ] Community building
- [ ] Physical exhibition tie-ins (2026)

---

## Open Questions

1. **Arrow selection**: Should users choose their arrow, or random assignment?
2. **Visual pairing**: How to map 101 GIFs to 320 arrows?
3. **Rarity**: Should some arrows be "rarer" based on theme/position?
4. **Utility**: Any holder benefits beyond ownership?
5. **Editions**: Single edition (1/1) or multiple editions per arrow?

---

## Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Merkle Tree Generator](https://github.com/OpenZeppelin/merkle-tree)
- [IPFS/Pinata](https://www.pinata.cloud/)
- [Arweave](https://www.arweave.org/)
- [Base Documentation](https://docs.base.org/)

---

## Contact

- **Creator**: pixlosopher
- **ETH Address**: pixlosopher.eth
- **X**: [@pixlosopher](https://x.com/pixlosopher)
- **Instagram**: [@pixlosopher](https://instagram.com/pixlosopher)

---

*"Every click casts a datashadow."*

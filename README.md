# 🎲 ONERAND

**ONERAND** is a secure, decentralized drawing system designed to select winners in a fair, transparent, and verifiable manner for [onepapel.com](https://onepapel.com). It leverages the Web Crypto API to generate a secure hash chain, with results entirely dependent on participant data and immutable draw metadata.

---

## 🚀 Key Features

- Cryptographically secure hash chains using SHA-256 and SHA-512 (Web Crypto API)
- Deterministic and fair winner selection based on participant data
- Robust API data retrieval with pre-validation and error handling
- Single-class, easy-to-integrate TypeScript implementation
- Customizable and extensible error handling system

---

## 📦 Installation

> `ONERAND` is implemented as a TypeScript class. Import it into your project as follows:

```typescript
import { ONERAND } from "path/to/onerand";
```

## 🔧 Usage

Integrate ONERAND with minimal setup. Use the following pattern to execute a secure random draw:

```js
const drawLink = "https://onepapel.com/draw/abc123";
const onerand = new ONERAND(drawLink);

onerand
  .chooseOne((step) => {
    console.log("Step:", step); // Track progress updates
  })
  .then((result) => {
    console.log("Draw Result:", result);
  })
  .catch((error) => {
    console.error("Draw failed:", error);
  });
```

## 📘 Return Value

The `chooseOne()` method returns a `Promise` that resolves to an object containing detailed draw results.

### 🎯 Result Structure

| Field               | Type     | Description                                                                                  |
| ------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `recipient`         | `object` | The selected participant's full object (includes user data such as `username`, `uuid`, etc.) |
| `winnerIndex`       | `number` | The index of the selected participant in the sorted list                                     |
| `totalParticipants` | `number` | Total number of participants included in the draw                                            |
| `seed`              | `string` | A deterministic string used as the cryptographic seed for hash generation                    |
| `hashChain`         | `object` | An object containing the two-stage hash values used in the winner selection                  |
| `timestamp`         | `string` | ISO 8601 formatted string indicating when the draw was finalized                             |
| `version`           | `string` | Version of the ONERAND system used (e.g., `"1.0"`)                                           |

---

### 🔗 `hashChain` Object

This object contains two cryptographic hashes forming the chain used to determine the winner:

| Field    | Type     | Description                                                      |
| -------- | -------- | ---------------------------------------------------------------- |
| `stage1` | `string` | SHA-256 hash of the seed                                         |
| `stage2` | `string` | SHA-512 hash of the seed concatenated with the closing timestamp |

> ✅ The `stage2` hash is the final value used to compute the winner index via modulo operation with the total number of participants.

---

### 📌 Example Output

```json
{
  "recipient": {
    "user": {
      "username": "alice",
      "uuid": "u12345"
    },
    "txId": "abcde123456"
  },
  "winnerIndex": 7,
  "totalParticipants": 15,
  "seed": "alice:u12345|bob:u67890_20250701120000_slug123",
  "hashChain": {
    "stage1": "f4e5c0d1a9...",
    "stage2": "b29ad3ef6a..."
  },
  "timestamp": "2025-07-01T12:00:00.000Z",
  "version": "1.0"
}
```

## 🧠 Algorithm Overview

ONERAND guarantees fairness and transparency through a deterministic cryptographic process. Below is a detailed breakdown of the algorithm:

---

### 1. 🧾 Participant Initialization

- Extract the `slug` from the draw link, e.g.,  
  `https://onepapel.com/draw/<slug>`
- Fetch draw data from the API endpoint: GET /api/public/onerand?slug=<slug>
- The API response includes:
- List of participants
- Draw closing timestamp (`closedAt`)
- Minimum required participants

- If the participant count is below the minimum threshold, the draw is aborted with an error.

---

### 2. 🔑 Seed Generation

Construct a unique, reproducible seed string by concatenating:

- All participant usernames and UUIDs, sorted by their transaction IDs (`txId`)
- The draw's closing timestamp (numeric format)
- The draw slug

**Seed format:**

`<username1>:<uuid1>|<username2>:<uuid2>|...<timestamp><slug>`

This seed forms the basis for the cryptographic hash chain.

---

### 3. 🔄 Hash Chain Computation

Compute two sequential cryptographic hashes using the Web Crypto API:

- **Stage 1 (`stage1`)**:
  `SHA-256(seed)`
- **Stage 2 (`stage2`)**:  
  `SHA-512(seed + closedAt)`

These hashes ensure unpredictability and immutability of the draw results.

---

### 4. 🎯 Winner Selection

- Convert the `stage2` hash from hexadecimal to a `BigInt`.
- Calculate the winner index by taking the modulo with the total number of participants:

  ```js
  const winnerIndex = BigInt("0x" + stage2) % BigInt(participants.length);
  ```

- The participant at `winnerIndex` in the sorted list is declared the winner.

---

## 📚 Additional Notes

- The entire process is deterministic: given the same inputs, the same winner will be selected.
- Sorting participants by `txId` ensures consistent ordering.
- The system uses standard cryptographic primitives available in modern browsers and environments supporting the Web Crypto API.
- Error handling is implemented via a custom `OneError` class with specific error codes for easy debugging.

---

## 🛠️ License & Contributions

[MIT]

Contributions and issues are welcome via the GitHub repository.

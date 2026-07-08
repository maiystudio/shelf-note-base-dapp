import type { Address } from "viem";

export const MAX_TITLE_LENGTH = 56;
export const MAX_AUTHOR_LENGTH = 48;
export const MAX_TOPIC_LENGTH = 40;
export const MAX_NOTE_LENGTH = 240;

export const shelfNoteAbi = [
  {
    type: "event",
    name: "NoteSaved",
    inputs: [
      { name: "noteId", type: "uint256", indexed: true },
      { name: "reader", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "author", type: "string", indexed: false },
      { name: "topic", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveNote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "author", type: "string" },
      { name: "topic", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "noteId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getNote",
    stateMutability: "view",
    inputs: [{ name: "noteId", type: "uint256" }],
    outputs: [
      { name: "reader", type: "address" },
      { name: "title", type: "string" },
      { name: "author", type: "string" },
      { name: "topic", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextNoteId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredShelfNoteContractAddress =
  process.env.NEXT_PUBLIC_SHELF_NOTE_CONTRACT_ADDRESS?.trim();

export const shelfNoteContractAddress = isAddressLike(configuredShelfNoteContractAddress)
  ? (configuredShelfNoteContractAddress as Address)
  : undefined;

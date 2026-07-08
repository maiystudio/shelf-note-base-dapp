"use client";

import {
  BadgeCheck,
  BookMarked,
  BookOpen,
  Bookmark,
  Library,
  Loader2,
  NotebookPen,
  Quote,
  Search,
  Tags,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_AUTHOR_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_TOPIC_LENGTH,
  shelfNoteAbi,
  shelfNoteContractAddress,
} from "@/lib/shelf-note";

const PRESETS = [
  {
    title: "The Creative Act",
    author: "Rick Rubin",
    topic: "attention",
    note: "Useful reminder: the work improves when attention gets quieter. Keep the daily ritual simple enough to repeat.",
  },
  {
    title: "Invisible Cities",
    author: "Italo Calvino",
    topic: "memory",
    note: "Every city in the book feels like a way of reading desire. Good source for compact worldbuilding prompts.",
  },
  {
    title: "Designing Interfaces",
    author: "Jenifer Tidwell",
    topic: "patterns",
    note: "A pattern language for product screens. Revisit before building flows that need to be obvious on first glance.",
  },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid title")) return "Title needs 1 to 56 characters.";
  if (error.message.includes("Invalid author")) return "Author needs 1 to 48 characters.";
  if (error.message.includes("Invalid topic")) return "Topic needs 1 to 40 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 240 characters.";
  return error.message;
}

function NoteCard({
  title,
  author,
  topic,
  note,
  reader,
  createdAt,
}: {
  title: string;
  author: string;
  topic: string;
  note: string;
  reader?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="index-card">
      <div className="card-tabs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="card-head">
        <div>
          <p className="eyebrow">Shelf Note</p>
          <h2>{title || "Untitled note"}</h2>
        </div>
        <div className="book-mark">
          <BookMarked aria-hidden="true" />
        </div>
      </div>

      <div className="catalog-row">
        <section>
          <BookOpen aria-hidden="true" />
          <p>Author</p>
          <strong>{author}</strong>
        </section>
        <section>
          <Tags aria-hidden="true" />
          <p>Topic</p>
          <strong>{topic}</strong>
        </section>
        <section>
          <Wallet aria-hidden="true" />
          <p>Reader</p>
          <strong>{shortAddress(reader)}</strong>
        </section>
        <section>
          <Bookmark aria-hidden="true" />
          <p>Saved</p>
          <strong>{formatDate(createdAt)}</strong>
        </section>
      </div>

      <section className="note-text">
        <Quote aria-hidden="true" />
        <p>Reading note</p>
        <strong>{note || "Write the idea, quote, or takeaway worth saving."}</strong>
      </section>
    </article>
  );
}

export function ShelfNoteApp() {
  const [noteIdInput, setNoteIdInput] = useState("1");
  const [title, setTitle] = useState<string>(PRESETS[0].title);
  const [author, setAuthor] = useState<string>(PRESETS[0].author);
  const [topic, setTopic] = useState<string>(PRESETS[0].topic);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Save a compact reading note on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedNoteId = BigInt(Math.max(1, Number(noteIdInput || "1")));

  const noteQuery = useReadContract({
    abi: shelfNoteAbi,
    address: shelfNoteContractAddress,
    functionName: "getNote",
    args: [parsedNoteId],
    query: { enabled: Boolean(shelfNoteContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: shelfNoteAbi,
    address: shelfNoteContractAddress,
    functionName: "nextNoteId",
    query: { enabled: Boolean(shelfNoteContractAddress), refetchInterval: 12000 },
  });

  const tuple = noteQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const liveNote = useMemo(
    () =>
      tuple
        ? {
            reader: tuple[0],
            title: tuple[1],
            author: tuple[2],
            topic: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalNotes = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE_LENGTH &&
    author.trim().length > 0 &&
    author.trim().length <= MAX_AUTHOR_LENGTH &&
    topic.trim().length > 0 &&
    topic.trim().length <= MAX_TOPIC_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !shelfNoteContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_SHELF_NOTE_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill title, author, topic, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;
    void totalQuery.refetch();
    void noteQuery.refetch();
    const logs = parseEventLogs({ abi: shelfNoteAbi, logs: receipt.logs, eventName: "NoteSaved" });
    const noteId = logs[0]?.args.noteId;
    window.setTimeout(() => {
      if (noteId) setNoteIdInput(noteId.toString());
      setMessage(noteId ? `Shelf note #${noteId.toString()} saved on Base.` : "Shelf note saved on Base.");
    }, 0);
  }, [lastAction, noteQuery, receipt, totalQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Save the note when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function saveNote() {
    const contractAddress = shelfNoteContractAddress;
    if (createBlocker) {
      setMessage(createBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("create");
      setMessage("Confirm the shelf note in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: shelfNoteAbi,
        functionName: "saveNote",
        args: [title.trim(), author.trim(), topic.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Shelf note sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setTitle(preset.title);
    setAuthor(preset.author);
    setTopic(preset.topic);
    setNote(preset.note);
  }

  return (
    <main className="min-h-screen bg-[#f4eee2] text-[#26201b]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-6">
        <aside className="shelf-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Shelf Note</p>
              <h1>Save a reading note.</h1>
            </div>
            <div className="panel-icon">
              <Library aria-hidden="true" />
            </div>
          </div>

          <div className="metric-row">
            <div>
              <p>Notes</p>
              <strong>{totalNotes}</strong>
            </div>
            <div>
              <p>Chain</p>
              <strong>Base</strong>
            </div>
          </div>

          <section className="form-box">
            <h2>New note</h2>
            <div className="preset-row">
              {PRESETS.map((preset, index) => (
                <button key={preset.title} onClick={() => applyPreset(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <label>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={MAX_TITLE_LENGTH} />
            </label>
            <label>
              <span>Author</span>
              <input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={MAX_AUTHOR_LENGTH} />
            </label>
            <label>
              <span>Topic</span>
              <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={MAX_TOPIC_LENGTH} />
            </label>
            <label>
              <span>Note</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={5} />
            </label>
          </section>

          <div className="action-stack">
            {isConnected && chainId !== base.id ? (
              <button className="primary warn" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button className="primary" disabled={writing || confirming} onClick={saveNote}>
                {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                Save Shelf Note
              </button>
            )}
            {isConnected ? (
              <button className="secondary" onClick={disconnectWallet}>
                {shortAddress(address)}
              </button>
            ) : (
              <button className="secondary" disabled={!selectedConnector || connecting} onClick={connectWallet}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}
            <p className="status">{message}</p>
            {hash ? (
              <a className="tx-link" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
                View transaction on BaseScan
              </a>
            ) : null}
          </div>
        </aside>

        <section className="display-stack">
          <NoteCard
            title={liveNote?.title || title}
            author={liveNote?.author || author}
            topic={liveNote?.topic || topic}
            note={liveNote?.note || note}
            reader={liveNote?.reader}
            createdAt={liveNote?.createdAt}
          />

          <div className="info-row">
            <section className="load-box">
              <div>
                <Search aria-hidden="true" />
                <h2>Load note</h2>
              </div>
              <label>
                <span>Note ID</span>
                <input value={noteIdInput} onChange={(event) => setNoteIdInput(event.target.value.replace(/\D/g, ""))} />
              </label>
            </section>

            <section className="about-box">
              <p className="eyebrow">What it does</p>
              <p>
                Shelf Note saves a compact reading card with title, author, topic, note, reader wallet, and timestamp on
                Base.
              </p>
              <div>
                <span><BookOpen aria-hidden="true" /> Book</span>
                <span><NotebookPen aria-hidden="true" /> Note</span>
                <span><Bookmark aria-hidden="true" /> Topic</span>
                <span><BadgeCheck aria-hidden="true" /> On Base</span>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

const DB_NAME = "Reflow";
const STORE_NAME = "pending-uploads";
const DB_VERSION = 1;

export type UploadTicket = {
  uploadUrl?: string;
  token?: string;
  storagePath: string;
  url: string;
  endpoint?: string;
};

type PendingUploadRecord = {
  key: string;
  canvasId: string;
  nodeId: string;
  fileName: string;
  file: File;
};

type PendingTicketRecord = {
  key: string;
  ticket: UploadTicket;
};

function getPendingUploadKey(canvasId: string, nodeId: string) {
  return `${canvasId}:${nodeId}`;
}

function getPendingTicketKey(fingerprint: string) {
  return `ticket:${fingerprint}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Unable to open pending uploads database"));
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = handler(store);

        request.onsuccess = () => {
          resolve(request.result as T);
        };

        request.onerror = () => {
          reject(request.error ?? new Error("Pending upload transaction failed"));
        };

        transaction.oncomplete = () => {
          database.close();
        };

        transaction.onerror = () => {
          reject(transaction.error ?? new Error("Pending upload transaction failed"));
        };
      })
  );
}

// ---- File byte persistence ----

export async function savePendingUploadFile(
  canvasId: string,
  nodeId: string,
  file: File
) {
  const record: PendingUploadRecord = {
    key: getPendingUploadKey(canvasId, nodeId),
    canvasId,
    nodeId,
    fileName: file.name,
    file,
  };

  await runTransaction("readwrite", (store) => store.put(record));
}

export async function getPendingUploadFile(
  canvasId: string,
  nodeId: string
): Promise<File | null> {
  const record = await runTransaction<PendingUploadRecord | undefined>(
    "readonly",
    (store) => store.get(getPendingUploadKey(canvasId, nodeId))
  );

  return record?.file ?? null;
}

export async function deletePendingUploadFile(
  canvasId: string,
  nodeId: string
) {
  await runTransaction("readwrite", (store) =>
    store.delete(getPendingUploadKey(canvasId, nodeId))
  );
}

// ---- Upload ticket persistence ----
// Cached by file fingerprint so a resumed/retried upload reuses the SAME
// tus endpoint, token, and storagePath rather than minting a fresh ticket
// that the original in-progress upload URL won't recognize.

export async function savePendingUploadTicket(
  fingerprint: string,
  ticket: UploadTicket
) {
  const record: PendingTicketRecord = {
    key: getPendingTicketKey(fingerprint),
    ticket,
  };

  await runTransaction("readwrite", (store) => store.put(record));
}

export async function getPendingUploadTicket(
  fingerprint: string
): Promise<UploadTicket | null> {
  const record = await runTransaction<PendingTicketRecord | undefined>(
    "readonly",
    (store) => store.get(getPendingTicketKey(fingerprint))
  );

  return record?.ticket ?? null;
}

export async function deletePendingUploadTicket(fingerprint: string) {
  await runTransaction("readwrite", (store) =>
    store.delete(getPendingTicketKey(fingerprint))
  );
}
import { DateTime } from "luxon";

type SynapseClient = {
  storage: {
    createDataSetAndAddPieces: (args: unknown) => Promise<unknown>;
  };
  payments?: {
    depositAndApprove?: (args: unknown) => Promise<unknown>;
  };
};

let clientPromise: Promise<SynapseClient | null> | null = null;

const missing = (key: string) => {
  throw new Error(`Missing required Synapse environment variable: ${key}`);
};

const buildSynapseConfig = () => {
  const network = (process.env.SYNAPSE_NETWORK ??
    process.env.FILECOIN_NETWORK ??
    "calibration") as "calibration" | "mainnet";
  const rpcUrl = process.env.SYNAPSE_RPC_URL ?? process.env.FILECOIN_RPC_URL ?? missing("SYNAPSE_RPC_URL");
  const privateKey =
    process.env.SYNAPSE_PRIVATE_KEY ?? process.env.FILECOIN_PRIVATE_KEY ?? missing("SYNAPSE_PRIVATE_KEY");

  return {
    network,
    rpcUrl,
    signer: privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    accountLabel: process.env.SYNAPSE_ACCOUNT_LABEL ?? `Vitals_${DateTime.utc().toFormat("yyyyLLdd_HHmm")}`,
  };
};

const lazyLoadSynapse = async (): Promise<SynapseClient | null> => {
  try {
    const { Synapse } = await import("@filoz/synapse-core");
    const config = buildSynapseConfig();
    const client = (await Synapse.create({
      network: config.network,
      signer: config.signer,
      transport: {
        type: "http",
        url: config.rpcUrl,
      },
      metadata: {
        app: "Vitals",
        accountLabel: config.accountLabel,
      },
      options: {
        retries: 2,
      },
    })) as SynapseClient;
    return client;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn("[Synapse] Failed to initialise client; falling back to deterministic storage. Reason:", reason);
    return null;
  }
};

export const getSynapseClient = () => {
  if (!process.env.SYNAPSE_PRIVATE_KEY && !process.env.FILECOIN_PRIVATE_KEY) {
    return Promise.resolve(null);
  }
  if (!clientPromise) {
    clientPromise = lazyLoadSynapse();
  }
  return clientPromise;
};



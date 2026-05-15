import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { onWalletEvent } from "@/lib/notifications";

interface NormalizedTransaction {
  provider: string;
  transactionId: string;
  amount: number;
  description: string;
  accountNumber: string;
  transactionTime: string | null;
}

function parseCasso(body: Record<string, unknown>): NormalizedTransaction[] {
  const data = (body.data ?? body) as Record<string, unknown>[];
  const items = Array.isArray(data) ? data : [data];
  return items.map((tx) => ({
    provider: "casso",
    transactionId: String(tx.id ?? tx.tid ?? ""),
    amount: Math.abs(Number(tx.amount ?? 0)),
    description: String(tx.description ?? tx.content ?? ""),
    accountNumber: String(tx.bankSubAccId ?? tx.subAccId ?? ""),
    transactionTime: tx.when ? String(tx.when) : null,
  }));
}

function parseSePay(body: Record<string, unknown>): NormalizedTransaction[] {
  return [
    {
      provider: "sepay",
      transactionId: String(body.id ?? body.referenceCode ?? ""),
      amount: Math.abs(Number(body.transferAmount ?? body.amount ?? 0)),
      description: String(body.content ?? body.description ?? ""),
      accountNumber: String(body.accountNumber ?? body.bankSubAccId ?? ""),
      transactionTime: body.transactionDate ? String(body.transactionDate) : null,
    },
  ];
}

function extractTransferReference(description: string): string | null {
  const match = description.match(/NAPVI[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}

export async function POST(request: Request) {
  const webhookEnabled = process.env.BANK_WEBHOOK_ENABLED === "true";
  const provider = (process.env.BANK_WEBHOOK_PROVIDER ?? "disabled").toLowerCase();
  const webhookSecret = process.env.BANK_WEBHOOK_SECRET ?? "";
  const allowedAccount = process.env.BANK_WEBHOOK_ALLOWED_ACCOUNT ?? "";

  if (!webhookEnabled || provider === "disabled") {
    console.log("[bank-webhook] disabled — ignoring request");
    return jsonResponse({ success: true, status: "ignored", reason: "webhook_disabled" });
  }

  // Verify secret
  const authHeader = request.headers.get("authorization") ?? request.headers.get("secure-token") ?? "";
  const headerSecret = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (webhookSecret && headerSecret !== webhookSecret) {
    console.warn("[bank-webhook] secret mismatch — rejecting");
    return jsonResponse({ success: false, error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }

  const rawPayload = JSON.stringify(body).slice(0, 4000);

  let transactions: NormalizedTransaction[];
  try {
    if (provider === "casso") {
      transactions = parseCasso(body);
    } else if (provider === "sepay") {
      transactions = parseSePay(body);
    } else {
      console.warn(`[bank-webhook] unknown provider: ${provider}`);
      return jsonResponse({ success: true, status: "ignored", reason: "unknown_provider" });
    }
  } catch {
    return jsonResponse({ success: false, error: "parse_error" }, 400);
  }

  const results: Array<{ transactionId: string; status: string }> = [];

  for (const tx of transactions) {
    if (!tx.transactionId || tx.amount <= 0) {
      results.push({ transactionId: tx.transactionId || "unknown", status: "IGNORED" });
      continue;
    }

    // Check duplicate
    const existing = await prisma.bankWebhookLog.findUnique({
      where: { provider_transactionId: { provider: tx.provider, transactionId: tx.transactionId } },
    });
    if (existing) {
      results.push({ transactionId: tx.transactionId, status: "DUPLICATE" });
      continue;
    }

    // Check allowed account
    if (allowedAccount && tx.accountNumber && tx.accountNumber !== allowedAccount) {
      await prisma.bankWebhookLog.create({
        data: {
          provider: tx.provider,
          transactionId: tx.transactionId,
          rawPayload,
          status: "IGNORED",
          amount: tx.amount,
          accountNumber: tx.accountNumber,
          transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
          errorReason: "account_mismatch",
        },
      });
      results.push({ transactionId: tx.transactionId, status: "IGNORED" });
      continue;
    }

    const transferRef = extractTransferReference(tx.description);

    if (!transferRef) {
      await prisma.bankWebhookLog.create({
        data: {
          provider: tx.provider,
          transactionId: tx.transactionId,
          rawPayload,
          status: "IGNORED",
          amount: tx.amount,
          accountNumber: tx.accountNumber,
          transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
          errorReason: "no_transfer_reference",
        },
      });
      results.push({ transactionId: tx.transactionId, status: "IGNORED" });
      continue;
    }

    // Find matching pending top-up request
    const topUpRequest = await prisma.walletTopUpRequest.findFirst({
      where: { transferReference: transferRef, status: "PENDING" },
    });

    if (!topUpRequest) {
      await prisma.bankWebhookLog.create({
        data: {
          provider: tx.provider,
          transactionId: tx.transactionId,
          rawPayload,
          status: "FAILED",
          transferReference: transferRef,
          amount: tx.amount,
          accountNumber: tx.accountNumber,
          transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
          errorReason: "no_pending_request",
        },
      });
      results.push({ transactionId: tx.transactionId, status: "FAILED" });
      continue;
    }

    // Verify amount matches
    const requestAmount = parseFloat(topUpRequest.amount.toString());
    if (tx.amount !== requestAmount) {
      await prisma.bankWebhookLog.create({
        data: {
          provider: tx.provider,
          transactionId: tx.transactionId,
          rawPayload,
          status: "FAILED",
          transferReference: transferRef,
          amount: tx.amount,
          accountNumber: tx.accountNumber,
          transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
          topUpRequestId: topUpRequest.id,
          errorReason: `amount_mismatch: expected=${requestAmount} received=${tx.amount}`,
        },
      });
      results.push({ transactionId: tx.transactionId, status: "FAILED" });
      continue;
    }

    // All checks passed — process wallet deposit
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: topUpRequest.customerId },
      });

      if (!wallet) {
        await prisma.bankWebhookLog.create({
          data: {
            provider: tx.provider,
            transactionId: tx.transactionId,
            rawPayload,
            status: "FAILED",
            transferReference: transferRef,
            amount: tx.amount,
            accountNumber: tx.accountNumber,
            transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
            topUpRequestId: topUpRequest.id,
            errorReason: "wallet_not_found",
          },
        });
        results.push({ transactionId: tx.transactionId, status: "FAILED" });
        continue;
      }

      const currentBalance = parseFloat(wallet.balance.toString());
      const depositAmount = tx.amount;
      const currentDebt = parseFloat(wallet.debt.toString());

      let newBalance = currentBalance + depositAmount;
      let newDebt = currentDebt;

      if (currentDebt > 0) {
        if (depositAmount >= currentDebt) {
          newBalance = currentBalance + depositAmount - currentDebt;
          newDebt = 0;
        } else {
          newDebt = currentDebt - depositAmount;
          newBalance = currentBalance;
        }
      }

      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: topUpRequest.customerId },
          data: { balance: newBalance, debt: newDebt },
        }),
        prisma.transaction.create({
          data: {
            userId: topUpRequest.customerId,
            type: "DEPOSIT",
            amount: depositAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Nạp tiền tự động (${tx.provider}) — ${transferRef}`,
            createdBy: topUpRequest.customerId,
          },
        }),
        prisma.walletTopUpRequest.update({
          where: { id: topUpRequest.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
        }),
        prisma.bankWebhookLog.create({
          data: {
            provider: tx.provider,
            transactionId: tx.transactionId,
            rawPayload,
            status: "CONFIRMED",
            transferReference: transferRef,
            amount: tx.amount,
            accountNumber: tx.accountNumber,
            transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
            topUpRequestId: topUpRequest.id,
          },
        }),
      ]);

      // Fire-and-forget notification
      prisma.user
        .findUnique({
          where: { id: topUpRequest.customerId },
          select: { email: true, fullName: true },
        })
        .then((customer) =>
          onWalletEvent({
            userId: topUpRequest.customerId,
            userEmail: customer?.email,
            userName: customer?.fullName,
            title: "Nạp tiền thành công",
            message: `Chào ${customer?.fullName || "bạn"}, ví của bạn đã được nạp ${depositAmount.toLocaleString()} VND (tự động xác nhận). Mã chuyển khoản: ${transferRef}. Số dư hiện tại: ${newBalance.toLocaleString()} VND.`,
          })
        )
        .catch((err: unknown) => {
          console.error("[bank-webhook] notification failed:", err);
        });

      console.log(`[bank-webhook] CONFIRMED | provider=${tx.provider} txId=${tx.transactionId} ref=${transferRef} amount=${tx.amount}`);
      results.push({ transactionId: tx.transactionId, status: "CONFIRMED" });
    } catch (err) {
      console.error(`[bank-webhook] processing error:`, err);
      await prisma.bankWebhookLog.create({
        data: {
          provider: tx.provider,
          transactionId: tx.transactionId,
          rawPayload,
          status: "FAILED",
          transferReference: transferRef,
          amount: tx.amount,
          accountNumber: tx.accountNumber,
          transactionTime: tx.transactionTime ? new Date(tx.transactionTime) : null,
          topUpRequestId: topUpRequest.id,
          errorReason: "processing_error",
        },
      }).catch(() => {});
      results.push({ transactionId: tx.transactionId, status: "FAILED" });
    }
  }

  return jsonResponse({ success: true, results });
}

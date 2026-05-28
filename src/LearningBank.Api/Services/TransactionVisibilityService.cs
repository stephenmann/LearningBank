using LearningBank.Domain.Entities;

namespace LearningBank.Api.Services;

public static class TransactionVisibilityService
{
    public static IReadOnlyList<Transaction> ForChildView(IReadOnlyList<Transaction> transactions)
    {
        var reversedOriginalIds = transactions
            .Where(IsReversalEntry)
            .Select(t => t.RelatedTransactionId!.Value)
            .ToHashSet();

        return transactions
            .Where(t => !IsReversalEntry(t) && !reversedOriginalIds.Contains(t.Id))
            .ToList();
    }

    private static bool IsReversalEntry(Transaction transaction)
    {
        if (transaction.RelatedTransactionId is null)
            return false;

        if (transaction.Type is not (TransactionType.Deposit or TransactionType.Withdrawal))
            return false;

        return transaction.Description.StartsWith("Reversal of ", StringComparison.OrdinalIgnoreCase);
    }
}

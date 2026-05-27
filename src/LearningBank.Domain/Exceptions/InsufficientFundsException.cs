namespace LearningBank.Domain.Exceptions;

public sealed class InsufficientFundsException : DomainException
{
    public InsufficientFundsException(decimal available, decimal requested)
        : base($"Insufficient funds. Available: {available:C}, Requested: {requested:C}") { }
}

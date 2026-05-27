namespace LearningBank.Api.Dtos;

public record CategoryDto(
    Guid Id,
    string Name,
    bool IsChildAllowed,
    bool IsArchived);

public record CreateCategoryRequest(string Name, bool IsChildAllowed);
public record UpdateCategoryRequest(string Name, bool IsChildAllowed);

namespace LearningBank.Api.Dtos;

public record UserDto(
    Guid Id,
    string DisplayName,
    string Email,
    string Role,
    bool IsActive);

public record ChildDto(
    Guid Id,
    string DisplayName,
    string Email,
    bool IsActive);

public record CreateChildRequest(
    string DisplayName,
    string Email);

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    MonetaryValue = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TargetAccount = table.Column<int>(type: "INTEGER", nullable: false),
                    RecurrenceType = table.Column<int>(type: "INTEGER", nullable: false),
                    Frequency = table.Column<int>(type: "INTEGER", nullable: true),
                    DaysOfWeekCsv = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    EndDateUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MaxOccurrences = table.Column<int>(type: "INTEGER", nullable: true),
                    StartDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CreatedByParentId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningTasks_Users_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskCompletions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OccurrenceDateUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedByChildAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    ReviewedByParentId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    ReviewNote = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskCompletions_LearningTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "LearningTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningTasks_ChildId_IsActive",
                table: "LearningTasks",
                columns: new[] { "ChildId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskCompletions_ChildId_Status",
                table: "TaskCompletions",
                columns: new[] { "ChildId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskCompletions_TaskId_OccurrenceDateUtc_Status",
                table: "TaskCompletions",
                columns: new[] { "TaskId", "OccurrenceDateUtc", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskCompletions");

            migrationBuilder.DropTable(
                name: "LearningTasks");
        }
    }
}

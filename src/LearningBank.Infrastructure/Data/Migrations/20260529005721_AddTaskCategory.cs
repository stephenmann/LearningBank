using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "LearningTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningTasks_CategoryId",
                table: "LearningTasks",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningTasks_Categories_CategoryId",
                table: "LearningTasks",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LearningTasks_Categories_CategoryId",
                table: "LearningTasks");

            migrationBuilder.DropIndex(
                name: "IX_LearningTasks_CategoryId",
                table: "LearningTasks");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "LearningTasks");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CAESAR.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeToProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "Projects",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Theme",
                table: "Projects");
        }
    }
}

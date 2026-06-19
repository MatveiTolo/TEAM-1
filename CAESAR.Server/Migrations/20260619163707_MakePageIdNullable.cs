using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CAESAR.Server.Migrations
{
    /// <inheritdoc />
    public partial class MakePageIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_ProjectPages_AllowedPageId",
                table: "Members");

            migrationBuilder.AlterColumn<int>(
                name: "AllowedPageId",
                table: "Members",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Members_ProjectPages_AllowedPageId",
                table: "Members",
                column: "AllowedPageId",
                principalTable: "ProjectPages",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_ProjectPages_AllowedPageId",
                table: "Members");

            migrationBuilder.AlterColumn<int>(
                name: "AllowedPageId",
                table: "Members",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Members_ProjectPages_AllowedPageId",
                table: "Members",
                column: "AllowedPageId",
                principalTable: "ProjectPages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

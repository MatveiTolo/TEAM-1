using CAESAR.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<ProjectPage> ProjectPages { get; set; } = null!;
        public DbSet<BoardTask> BoardTasks { get; set; } = null!;
        public DbSet<Member> Members { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<BoardTaskHistory> TaskHistories { get; set; } = null!;
        public DbSet<UserNotification> UserNotifications { get; set; } = null!;
        public DbSet<TelegramLink> TelegramLinks { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserNotification>()
                .HasIndex(un => new { un.UserId, un.Provider })
                .IsUnique();

            modelBuilder.Entity<Member>()
                .HasIndex(m => new { m.UserId, m.ProjectId })
                .IsUnique();

            // Донастроить связи между сущностями, если необходимо
        }
    }
}

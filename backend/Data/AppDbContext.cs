using Microsoft.EntityFrameworkCore;
using InventorySystem.Models;

namespace InventorySystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>              Users              { get; set; }
    public DbSet<Category>          Categories         { get; set; }
    public DbSet<Supplier>          Suppliers          { get; set; }
    public DbSet<Product>           Products           { get; set; }
    public DbSet<StockLog>          StockLogs          { get; set; }
    public DbSet<PurchaseOrder>     PurchaseOrders     { get; set; }
    public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    public DbSet<AuditLog>          AuditLogs          { get; set; }
    public DbSet<Notification>      Notifications      { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();

        mb.Entity<Product>()
            .HasOne(p => p.Category).WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<Product>()
            .HasOne(p => p.Supplier).WithMany(s => s.Products)
            .HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.SetNull);

        mb.Entity<StockLog>()
            .HasOne(s => s.Product).WithMany(p => p.StockLogs)
            .HasForeignKey(s => s.ProductId).OnDelete(DeleteBehavior.Cascade);

        mb.Entity<PurchaseOrder>()
            .HasOne(po => po.Supplier).WithMany(s => s.PurchaseOrders)
            .HasForeignKey(po => po.SupplierId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<PurchaseOrderItem>()
            .HasOne(i => i.PurchaseOrder).WithMany(po => po.Items)
            .HasForeignKey(i => i.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);

        mb.Entity<PurchaseOrderItem>()
            .HasOne(i => i.Product).WithMany()
            .HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<Product>().Property(p => p.Price).HasColumnType("decimal(18,2)");
        mb.Entity<PurchaseOrderItem>().Property(i => i.UnitCost).HasColumnType("decimal(18,2)");
        mb.Entity<PurchaseOrder>().Property(po => po.TotalAmount).HasColumnType("decimal(18,2)");

        mb.Entity<Product>().HasIndex(p => p.SKU);
        mb.Entity<Product>().HasIndex(p => p.CategoryId);
        mb.Entity<StockLog>().HasIndex(s => s.ProductId);
        mb.Entity<StockLog>().HasIndex(s => s.CreatedAt);
        mb.Entity<AuditLog>().HasIndex(a => a.CreatedAt);
        mb.Entity<AuditLog>().HasIndex(a => a.Entity);

        mb.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Electronics",   Description = "Electronic items" },
            new Category { Id = 2, Name = "Office Supply", Description = "Office stationery" },
            new Category { Id = 3, Name = "Furniture",     Description = "Office furniture" }
        );
    }
}

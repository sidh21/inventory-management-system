using InventorySystem.Data;
using InventorySystem.Models;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Services;

public interface INotificationService
{
    Task CreateAsync(string title, string message, string type = "info", string? link = null);
    Task CheckLowStockAsync();
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db) => _db = db;

    public async Task CreateAsync(string title, string message, string type = "info", string? link = null)
    {
        _db.Notifications.Add(new Notification { Title = title, Message = message, Type = type, Link = link });
        await _db.SaveChangesAsync();
    }

    public async Task CheckLowStockAsync()
    {
        var lowStockProducts = await _db.Products
            .Where(p => p.IsActive && p.Quantity <= p.ReorderLevel)
            .ToListAsync();

        foreach (var product in lowStockProducts)
        {
            var exists = await _db.Notifications.AnyAsync(n =>
                n.Link == $"/products?id={product.Id}" && !n.IsRead);
            if (!exists)
            {
                await CreateAsync(
                    "Low Stock Alert",
                    $"{product.Name} has only {product.Quantity} units left (reorder level: {product.ReorderLevel})",
                    "warning",
                    $"/products?id={product.Id}"
                );
            }
        }
    }
}

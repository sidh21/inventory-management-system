using InventorySystem.Data;
using InventorySystem.Models;

namespace InventorySystem.Services;

public interface IAuditService
{
    Task LogAsync(string action, string entity, string? entityId, string? oldValues, string? newValues, string performedBy, string ipAddress);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    public AuditService(AppDbContext db) => _db = db;

    public async Task LogAsync(string action, string entity, string? entityId,
        string? oldValues, string? newValues, string performedBy, string ipAddress)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Action      = action,
            Entity      = entity,
            EntityId    = entityId,
            OldValues   = oldValues,
            NewValues   = newValues,
            PerformedBy = performedBy,
            IpAddress   = ipAddress,
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}

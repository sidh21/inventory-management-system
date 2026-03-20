using InventorySystem.Data;
using InventorySystem.DTOs;
using InventorySystem.Models;
using InventorySystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Controllers;

// ─── Reports Controller ────────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;
    public ReportsController(IReportService reports) => _reports = reports;

    [HttpGet("inventory")]
    public async Task<IActionResult> InventoryReport()
        => Ok(await _reports.GetInventoryReportAsync());

    [HttpGet("stock-movements")]
    public async Task<IActionResult> StockMovements([FromQuery] int days = 30)
        => Ok(await _reports.GetStockMovementSummaryAsync(days));

    [HttpGet("export/products")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportProducts()
    {
        var bytes = await _reports.ExportProductsToExcelAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Products_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("export/stock-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportStockLogs(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var bytes = await _reports.ExportStockLogsToExcelAsync(from, to);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"StockLogs_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}

// ─── Notifications Controller ──────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext        _db;
    private readonly INotificationService _notif;

    public NotificationsController(AppDbContext db, INotificationService notif)
    { _db = db; _notif = notif; }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false)
    {
        var query = _db.Notifications.AsQueryable();
        if (unreadOnly) query = query.Where(n => !n.IsRead);
        var items = await query.OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
        return Ok(items);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
        => Ok(new { count = await _db.Notifications.CountAsync(n => !n.IsRead) });

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _db.Notifications.Where(n => !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound();
        _db.Notifications.Remove(n);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("check-stock")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CheckStock()
    {
        await _notif.CheckLowStockAsync();
        return Ok(new { message = "Stock check complete" });
    }
}

// ─── Audit Logs Controller ─────────────────────────────────
[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuditLogsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? entity,
        [FromQuery] string? action,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.AuditLogs.AsQueryable();
        if (!string.IsNullOrEmpty(entity)) query = query.Where(a => a.Entity == entity);
        if (!string.IsNullOrEmpty(action)) query = query.Where(a => a.Action == action);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }
}

// ─── Users Management Controller ──────────────────────────
[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.CreatedAt })
            .ToListAsync();
        return Ok(users);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.Name = dto.Name;
        user.Role = dto.Role;
        if (!string.IsNullOrEmpty(dto.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        await _db.SaveChangesAsync();
        return Ok(new { message = "User updated" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var me = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (me == id.ToString()) return BadRequest(new { message = "Cannot delete yourself" });
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

// ─── QR Code Controller ────────────────────────────────────
[ApiController]
[Route("api/products/{id}/qr")]
[Authorize]
public class QRController : ControllerBase
{
    private readonly AppDbContext  _db;
    private readonly IQRCodeService _qr;
    public QRController(AppDbContext db, IQRCodeService qr) { _db = db; _qr = qr; }

    [HttpGet]
    public async Task<IActionResult> GetQR(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        var base64 = _qr.GenerateProductQR(product.Id, product.Name, product.SKU);
        return Ok(new { qrCode = $"data:image/png;base64,{base64}", product = new { product.Id, product.Name, product.SKU } });
    }
}
